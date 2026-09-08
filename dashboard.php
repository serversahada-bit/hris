<?php
session_start();

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if (!isset($_SESSION['admin_id'])) {
    $_SESSION['admin_id'] = 1;
    $_SESSION['admin_name'] = "HC Nurul";
}

if (file_exists(__DIR__ . '/../config/database.php')) {
    require __DIR__ . '/../config/database.php';
} else {
    $conn = mysqli_connect("localhost", "root", "", "db_hrd");
}

date_default_timezone_set('Asia/Jakarta');

function has_table($conn, $table) {
    $res = mysqli_query($conn, "SHOW TABLES LIKE '" . mysqli_real_escape_string($conn, $table) . "'");
    return ($res && mysqli_num_rows($res) > 0);
}
function has_col($conn, $table, $column) {
    if (!has_table($conn, $table)) return false;
    $res = mysqli_query($conn, "SHOW COLUMNS FROM `$table` LIKE '" . mysqli_real_escape_string($conn, $column) . "'");
    return ($res && mysqli_num_rows($res) > 0);
}

// 1. Parameter Filter
$selectedDate = isset($_GET['tanggal']) ? $_GET['tanggal'] : date('Y-m-d');
$currentMonth = date('Y-m', strtotime($selectedDate));
$today = $selectedDate;

$att_table = has_table($conn, 'presensi') ? 'presensi' : (has_table($conn, 'absensi') ? 'absensi' : null);

// 2. Stat Cards Data
$totalKaryawan = 0;
$res = mysqli_query($conn, "SELECT COUNT(*) as c FROM karyawan WHERE status_karyawan != 'Non-Aktif'");
if($res) { $row = mysqli_fetch_assoc($res); $totalKaryawan = (int)$row['c']; }

$hadirHariIni = 0;
$terlambatHariIni = 0;
if ($att_table) {
    $res = mysqli_query($conn, "SELECT COUNT(*) as c FROM `$att_table` WHERE tanggal = '$today' AND status IN ('Hadir', 'Terlambat')");
    if($res) { $row = mysqli_fetch_assoc($res); $hadirHariIni = (int)$row['c']; }
    
    $res = mysqli_query($conn, "SELECT COUNT(*) as c FROM `$att_table` WHERE tanggal = '$today' AND status = 'Terlambat'");
    if($res) { $row = mysqli_fetch_assoc($res); $terlambatHariIni = (int)$row['c']; }
}

$izinPending = 0;
if (has_table($conn, 'pengajuan_izin')) {
    $res = mysqli_query($conn, "SELECT COUNT(*) as c FROM pengajuan_izin WHERE status = 'Pending'");
    if($res) { $row = mysqli_fetch_assoc($res); $izinPending = (int)$row['c']; }
}

// 3. Charts Data (7 Days)
$chartDates = [];
$chartHadir = [];
$chartTerlambat = [];
$chartMengaji = [];

for ($i = 6; $i >= 0; $i--) {
    $d = date('Y-m-d', strtotime("-$i days", strtotime($today)));
    $chartDates[] = date('d M', strtotime($d));
    
    $h = 0; $t = 0;
    if ($att_table) {
        $res = mysqli_query($conn, "SELECT 
            SUM(CASE WHEN status IN ('Hadir','Terlambat') THEN 1 ELSE 0 END) as h,
            SUM(CASE WHEN status = 'Terlambat' THEN 1 ELSE 0 END) as t
            FROM `$att_table` WHERE tanggal = '$d'");
        if ($res && $row = mysqli_fetch_assoc($res)) {
            $h = (int)$row['h'];
            $t = (int)$row['t'];
        }
    }
    $chartHadir[] = $h;
    $chartTerlambat[] = $t;
    
    $m = 0;
    if (has_table($conn, 'mengaji_baca')) {
        $res = mysqli_query($conn, "SELECT SUM((halaman_selesai - halaman_mulai) + 1) as c FROM mengaji_baca WHERE tanggal = '$d'");
        if ($res && $row = mysqli_fetch_assoc($res)) {
            $m = (int)$row['c'];
        }
    }
    $chartMengaji[] = $m;
}

// 4. Status Kerja Chart
$chartStatusKerjaLabels = ['Kontrak', 'Tetap', 'Probation'];
$chartStatusKerjaValues = [0, 0, 0];
$res = mysqli_query($conn, "SELECT status_karyawan, COUNT(*) as c FROM karyawan WHERE status_karyawan != 'Non-Aktif' GROUP BY status_karyawan");
if ($res) {
    $labels = []; $values = [];
    while($row = mysqli_fetch_assoc($res)) {
        $labels[] = $row['status_karyawan'] ?: 'Lainnya';
        $values[] = (int)$row['c'];
    }
    if (count($labels) > 0) {
        $chartStatusKerjaLabels = $labels;
        $chartStatusKerjaValues = $values;
    }
}

// 5. Lists (Top Karyawan Rajin, Mengaji, Aktivitas)
$topKaryawan = [];
if ($att_table) {
    $m_start = date('Y-m-01', strtotime($today));
    $m_end = date('Y-m-t', strtotime($today));
    $q = "SELECT k.id, k.nama, k.posisi, COUNT(a.id) as total_hadir 
          FROM karyawan k 
          JOIN `$att_table` a ON k.id = a.karyawan_id 
          WHERE a.tanggal BETWEEN '$m_start' AND '$m_end' AND a.status IN ('Hadir','Terlambat') AND k.status_karyawan != 'Non-Aktif'
          GROUP BY k.id 
          ORDER BY total_hadir DESC LIMIT 4";
    if (has_col($conn, 'karyawan', 'posisi')) {
        $res = mysqli_query($conn, $q);
        if ($res) {
            while($row = mysqli_fetch_object($res)) { $topKaryawan[] = $row; }
        }
    } else {
        $q = "SELECT k.id, k.nama, 'Staff' as posisi, COUNT(a.id) as total_hadir 
          FROM karyawan k 
          JOIN `$att_table` a ON k.id = a.karyawan_id 
          WHERE a.tanggal BETWEEN '$m_start' AND '$m_end' AND a.status IN ('Hadir','Terlambat') AND k.status_karyawan != 'Non-Aktif'
          GROUP BY k.id 
          ORDER BY total_hadir DESC LIMIT 4";
        $res = mysqli_query($conn, $q);
        if ($res) {
            while($row = mysqli_fetch_object($res)) { $topKaryawan[] = $row; }
        }
    }
}

$topMengaji = [];
if (has_table($conn, 'mengaji_baca')) {
    $m_start = date('Y-m-01', strtotime($today));
    $m_end = date('Y-m-t', strtotime($today));
    $pos_col = has_col($conn, 'karyawan', 'posisi') ? 'k.posisi' : "'Staff' as posisi";
    $q = "SELECT k.id, k.nama, $pos_col, SUM((m.halaman_selesai - m.halaman_mulai) + 1) as total_halaman 
          FROM karyawan k 
          JOIN mengaji_baca m ON k.id = m.karyawan_id 
          WHERE m.tanggal BETWEEN '$m_start' AND '$m_end' AND k.status_karyawan != 'Non-Aktif'
          GROUP BY k.id 
          ORDER BY total_halaman DESC LIMIT 4";
    $res = mysqli_query($conn, $q);
    if ($res) {
        while($row = mysqli_fetch_object($res)) { $topMengaji[] = $row; }
    }
}

$aktivitasTerbaru = [];
if ($att_table && has_col($conn, $att_table, 'jam_masuk')) {
    $pos_col = has_col($conn, 'karyawan', 'posisi') ? 'k.posisi' : "'Staff' as posisi";
    $q = "SELECT k.id as karyawan_id, k.nama, $pos_col, a.jam_masuk, a.tanggal 
          FROM karyawan k 
          JOIN `$att_table` a ON k.id = a.karyawan_id 
          WHERE a.status = 'Terlambat' AND a.jam_masuk IS NOT NULL AND k.status_karyawan != 'Non-Aktif'
          ORDER BY a.tanggal DESC, a.jam_masuk DESC LIMIT 5";
    $res = mysqli_query($conn, $q);
    if ($res) {
        while($row = mysqli_fetch_object($res)) { $aktivitasTerbaru[] = $row; }
    }
}

// 6. Circular Charts Data
$chartGenderLabels = ['Laki-laki', 'Perempuan'];
$chartGenderValues = [0, 0];
if (has_col($conn, 'karyawan', 'jenis_kelamin')) {
    $res = mysqli_query($conn, "SELECT jenis_kelamin, COUNT(*) as c FROM karyawan WHERE status_karyawan != 'Non-Aktif' GROUP BY jenis_kelamin");
    if($res) {
        $labels = []; $values = [];
        while($row = mysqli_fetch_assoc($res)){
            $labels[] = $row['jenis_kelamin'] ?: 'N/A';
            $values[] = (int)$row['c'];
        }
        if (count($labels)>0) { $chartGenderLabels = $labels; $chartGenderValues = $values; }
    }
}

$chartIzinLabels = ['Sakit', 'Izin', 'Cuti'];
$chartIzinValues = [0, 0, 0];
if (has_table($conn, 'pengajuan_izin') && has_col($conn, 'pengajuan_izin', 'jenis')) {
    $res = mysqli_query($conn, "SELECT jenis, COUNT(*) as c FROM pengajuan_izin GROUP BY jenis");
    if($res) {
        $labels = []; $values = [];
        while($row = mysqli_fetch_assoc($res)){
            $labels[] = $row['jenis'] ?: 'Lainnya';
            $values[] = (int)$row['c'];
        }
        if (count($labels)>0) { $chartIzinLabels = $labels; $chartIzinValues = $values; }
    }
}

$chartLemburLabels = ['Pending', 'Disetujui', 'Ditolak'];
$chartLemburValues = [0, 0, 0];
if (has_table($conn, 'pengajuan_lembur') && has_col($conn, 'pengajuan_lembur', 'status')) {
    $res = mysqli_query($conn, "SELECT status, COUNT(*) as c FROM pengajuan_lembur GROUP BY status");
    if($res) {
        $labels = []; $values = [];
        while($row = mysqli_fetch_assoc($res)){
            $labels[] = $row['status'] ?: 'Unknown';
            $values[] = (int)$row['c'];
        }
        if (count($labels)>0) { $chartLemburLabels = $labels; $chartLemburValues = $values; }
    }
}

$chartDivisiLabels = ['IT', 'HRD', 'Finance', 'Marketing'];
$chartDivisiValues = [0, 0, 0, 0];
if (has_col($conn, 'karyawan', 'organisasi')) {
    $res = mysqli_query($conn, "SELECT organisasi, COUNT(*) as c FROM karyawan WHERE status_karyawan != 'Non-Aktif' GROUP BY organisasi");
    if($res) {
        $labels = []; $values = [];
        while($row = mysqli_fetch_assoc($res)){
            $labels[] = $row['organisasi'] ?: 'Umum';
            $values[] = (int)$row['c'];
        }
        if (count($labels)>0) { $chartDivisiLabels = $labels; $chartDivisiValues = $values; }
    }
}

// Layout Include
$page_title = "Dashboard - Great HRD Workspace";
$page = "dashboard";
require __DIR__ . "/../components/layout_top.php";

$bulanIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
$tgl = date('d', strtotime($selectedDate));
$bln = $bulanIndo[(int)date('m', strtotime($selectedDate)) - 1];
$thn = date('Y', strtotime($selectedDate));
$selectedDateFormatted = $tgl . ' ' . $bln . ' ' . $thn;
?>

<!-- Dashboard Header & Filter -->
<div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
    <div>
        <h2 class="text-2xl font-extrabold text-slate-800">Dashboard Utama</h2>
        <p class="text-sm font-bold text-slate-400">Ringkasan data per <span class="text-brand-600"><?= $selectedDateFormatted ?></span></p>
    </div>
    <div class="flex items-center gap-3">
        <form action="dashboard.php" method="GET" class="flex items-center">
            <input type="date" name="tanggal" value="<?= htmlspecialchars($selectedDate) ?>" class="h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-200" onchange="this.form.submit()">
        </form>
    </div>
</div>

<!-- TOP ROW: Big Chart & Stat Cards -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <!-- Big Chart: Kehadiran (col-span-8) -->
    <div class="glass-panel rounded-3xl shadow-card p-6 lg:col-span-8 flex flex-col">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h3 class="text-lg font-extrabold text-slate-800">Statistik Kehadiran</h3>
                <p class="text-sm font-bold text-slate-400">7 Hari Terakhir</p>
            </div>
            <div class="flex items-center gap-4 text-sm font-bold">
                <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-[#10b981]"></span> Hadir</span>
                <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-[#f43f5e]"></span> Terlambat</span>
            </div>
        </div>
        <div class="relative flex-1 w-full min-h-[300px]">
            <canvas id="attendanceChart"></canvas>
        </div>
    </div>

    <!-- 4 Stat Cards (col-span-4, nested grid) -->
    <div class="lg:col-span-4 grid grid-cols-2 gap-4">
        <!-- Stat 1 -->
        <div class="glass-panel p-5 rounded-3xl shadow-card flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-slate-500 font-bold text-sm">Total Karyawan</h3>
                <div class="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 grid place-items-center">
                    <span class="material-symbols-outlined text-[22px]">groups</span>
                </div>
            </div>
            <div>
                <p class="text-3xl font-extrabold text-slate-800"><?= number_format($totalKaryawan) ?></p>
                <p class="text-xs font-bold text-slate-400 mt-1">Aktif saat ini</p>
            </div>
        </div>

        <!-- Stat 2 -->
        <div class="glass-panel p-5 rounded-3xl shadow-card flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-slate-500 font-bold text-sm">Hadir Hari Ini</h3>
                <div class="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center">
                    <span class="material-symbols-outlined text-[22px]">how_to_reg</span>
                </div>
            </div>
            <div>
                <p class="text-3xl font-extrabold text-slate-800"><?= number_format($hadirHariIni) ?></p>
                <?php if($totalKaryawan > 0): ?>
                <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md mt-1">
                    <span class="material-symbols-outlined text-[14px]">trending_up</span> <?= round(($hadirHariIni / $totalKaryawan) * 100) ?>%
                </span>
                <?php endif; ?>
            </div>
        </div>

        <!-- Stat 3 -->
        <div class="glass-panel p-5 rounded-3xl shadow-card flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-slate-500 font-bold text-sm">Izin Pending</h3>
                <div class="h-10 w-10 rounded-full bg-amber-50 text-amber-600 grid place-items-center">
                    <span class="material-symbols-outlined text-[22px]">event_busy</span>
                </div>
            </div>
            <div>
                <p class="text-3xl font-extrabold text-slate-800"><?= number_format($izinPending) ?></p>
                <p class="text-xs font-bold text-slate-400 mt-1">Butuh aksi</p>
            </div>
        </div>

        <!-- Stat 4 -->
        <div class="glass-panel p-5 rounded-3xl shadow-card flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-slate-500 font-bold text-sm">Terlambat</h3>
                <div class="h-10 w-10 rounded-full bg-rose-50 text-rose-600 grid place-items-center">
                    <span class="material-symbols-outlined text-[22px]">schedule</span>
                </div>
            </div>
            <div>
                <p class="text-3xl font-extrabold text-slate-800"><?= number_format($terlambatHariIni) ?></p>
                <span class="inline-flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md mt-1">
                    <span class="material-symbols-outlined text-[14px]">trending_down</span> Hari Ini
                </span>
            </div>
        </div>
    </div>
</div>

<!-- MIDDLE ROW: Line Chart, Bar Chart, List -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
    <!-- Mengaji Line Chart (col-span-4) -->
    <div class="glass-panel rounded-3xl shadow-card p-6 lg:col-span-4 flex flex-col">
        <h3 class="text-lg font-extrabold text-slate-800">Tren Mengaji</h3>
        <p class="text-[12px] font-bold text-slate-400 mb-4">Setoran 7 Hari Terakhir</p>
        <div class="relative flex-1 w-full min-h-[220px]">
            <canvas id="mengajiChart"></canvas>
        </div>
    </div>

    <!-- Status Kerja Bar Chart (col-span-4) -->
    <div class="glass-panel rounded-3xl shadow-card p-6 lg:col-span-4 flex flex-col">
        <h3 class="text-lg font-extrabold text-slate-800">Status Karyawan</h3>
        <p class="text-[12px] font-bold text-slate-400 mb-4">Rata-rata Distribusi</p>
        <div class="relative flex-1 w-full min-h-[220px]">
            <canvas id="statusKerjaChart"></canvas>
        </div>
    </div>

    <!-- Top Ranking Rajin (col-span-4) -->
    <div class="glass-panel rounded-3xl shadow-card p-6 lg:col-span-4 flex flex-col">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-extrabold text-slate-800">Top Karyawan Rajin</h3>
            <span class="text-[11px] font-bold bg-brand-50 text-brand-600 px-2 py-1 rounded-md">Bulan Ini</span>
        </div>
        
        <div class="flex-1 space-y-3">
            <?php if(count($topKaryawan) > 0): ?>
                <?php foreach($topKaryawan as $index => $top): ?>
                    <div class="flex items-center justify-between pb-3 <?= ($index < count($topKaryawan)-1) ? 'border-b border-slate-100' : '' ?>">
                        <div class="flex items-center gap-3">
                            <img src="https://ui-avatars.com/api/?name=<?= urlencode($top->nama) ?>&background=f1f5f9" class="w-9 h-9 rounded-full">
                            <div>
                                <p class="font-bold text-slate-800 text-sm leading-tight"><?= htmlspecialchars($top->nama) ?></p>
                                <p class="text-[11px] font-semibold text-slate-400"><?= htmlspecialchars($top->posisi ?? 'Karyawan') ?></p>
                            </div>
                        </div>
                        <p class="text-sm font-black text-slate-700"><?= htmlspecialchars($top->total_hadir) ?> <span class="text-[10px] text-slate-400 font-bold">Hadir</span></p>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <p class="text-center text-sm font-bold text-slate-400 py-4">Belum ada data.</p>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- BOTTOM ROW: List & Wide Table -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
    <!-- Top Mengaji List (col-span-4) -->
    <div class="glass-panel rounded-3xl shadow-card p-6 lg:col-span-4 flex flex-col bg-gradient-to-br from-white to-sky-50/30">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-extrabold text-slate-800">Top Setoran Mengaji</h3>
            <span class="text-[11px] font-bold bg-sky-100 text-sky-600 px-2 py-1 rounded-md">Bulan Ini</span>
        </div>
        
        <div class="flex-1 space-y-3">
            <?php if(count($topMengaji) > 0): ?>
                <?php foreach($topMengaji as $index => $top): ?>
                    <div class="flex items-center justify-between pb-3 <?= ($index < count($topMengaji)-1) ? 'border-b border-slate-100' : '' ?>">
                        <div class="flex items-center gap-3">
                            <div class="h-9 w-9 rounded-full bg-white shadow-sm border border-slate-100 grid place-items-center text-sm font-black text-sky-600">
                                #<?= $index + 1 ?>
                            </div>
                            <div>
                                <p class="font-bold text-slate-800 text-sm leading-tight"><?= htmlspecialchars($top->nama) ?></p>
                                <p class="text-[11px] font-semibold text-slate-400"><?= htmlspecialchars($top->posisi ?? 'Karyawan') ?></p>
                            </div>
                        </div>
                        <p class="text-sm font-black text-sky-600"><?= htmlspecialchars($top->total_halaman) ?> <span class="text-[10px] text-slate-400 font-bold">Hal</span></p>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <p class="text-center text-sm font-bold text-slate-400 py-4">Belum ada data.</p>
            <?php endif; ?>
        </div>
    </div>

    <!-- Recent Activity Table (col-span-8) -->
    <div class="glass-panel rounded-3xl shadow-card p-6 lg:col-span-8">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <span class="material-symbols-outlined text-rose-500">warning</span>
                Aktivitas Terlambat Terbaru
            </h3>
            <a href="kehadiran.php" class="text-[12px] font-bold text-brand-600 hover:underline">Lihat Semua</a>
        </div>
        
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b-2 border-slate-100">
                        <th class="py-3 px-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Karyawan</th>
                        <th class="py-3 px-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Jam Masuk</th>
                        <th class="py-3 px-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Status</th>
                        <th class="py-3 px-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody class="text-sm font-medium text-slate-600">
                    <?php if(count($aktivitasTerbaru) > 0): ?>
                        <?php foreach($aktivitasTerbaru as $aktivitas): ?>
                            <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td class="py-3 px-2 flex items-center gap-3">
                                    <img src="https://ui-avatars.com/api/?name=<?= urlencode($aktivitas->nama) ?>&background=f8fafc" class="w-8 h-8 rounded-full border border-slate-200">
                                    <div>
                                        <p class="font-bold text-slate-800 text-sm"><?= htmlspecialchars($aktivitas->nama) ?></p>
                                        <p class="text-[11px] text-slate-400"><?= htmlspecialchars($aktivitas->posisi ?? '-') ?></p>
                                    </div>
                                </td>
                                <td class="py-3 px-2">
                                    <p class="font-bold text-slate-700"><?= date('H:i', strtotime($aktivitas->jam_masuk)) ?> WIB</p>
                                    <p class="text-[10px] text-slate-400 font-bold"><?= date('d M Y', strtotime($aktivitas->tanggal)) ?></p>
                                </td>
                                <td class="py-3 px-2">
                                    <?php if($aktivitas->jam_masuk > '08:00:00'): ?>
                                        <span class="px-2 py-1 rounded-md bg-rose-50 text-rose-600 text-[11px] font-bold">Terlambat</span>
                                    <?php else: ?>
                                        <span class="px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[11px] font-bold">Tepat Waktu</span>
                                    <?php endif; ?>
                                </td>
                                <td class="py-3 px-2 text-right relative group">
                                    <button class="p-1.5 rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-all focus:outline-none">
                                        <span class="material-symbols-outlined text-[18px]">more_horiz</span>
                                    </button>
                                    <!-- Action Dropdown -->
                                    <div class="absolute right-8 top-10 mt-0 w-40 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-left">
                                        <div class="py-1">
                                            <a href="detail.php?id=<?= $aktivitas->karyawan_id ?>" class="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-brand-600">
                                                <span class="material-symbols-outlined text-[16px]">person</span> Profil
                                            </a>
                                            <a href="kehadiran.php?karyawan_id=<?= $aktivitas->karyawan_id ?>" class="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-brand-600">
                                                <span class="material-symbols-outlined text-[16px]">history</span> Log Presensi
                                            </a>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="4" class="py-8 text-center text-sm font-bold text-slate-400">Belum ada aktivitas presensi apapun.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- EXTRA ROW: Circular Composition Charts -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pb-10">
    <div class="glass-panel rounded-3xl shadow-card p-5"><h3 class="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 text-center">Komposisi Gender</h3><div class="relative h-32 w-full"><canvas id="genderChart"></canvas></div></div>
    <div class="glass-panel rounded-3xl shadow-card p-5"><h3 class="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 text-center">Tipe Izin & Cuti</h3><div class="relative h-32 w-full"><canvas id="izinChart"></canvas></div></div>
    <div class="glass-panel rounded-3xl shadow-card p-5"><h3 class="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 text-center">Status Lembur</h3><div class="relative h-32 w-full"><canvas id="lemburChart"></canvas></div></div>
    <div class="glass-panel rounded-3xl shadow-card p-5"><h3 class="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 text-center">Sebaran Divisi</h3><div class="relative h-32 w-full"><canvas id="divisiChart"></canvas></div></div>
</div>

<!-- Chart.js Script -->
<script>
(function() {
    ['attendanceChart', 'mengajiChart', 'statusKerjaChart', 'genderChart', 'izinChart', 'lemburChart', 'divisiChart'].forEach(id => {
        let existingChart = Chart.getChart(id);
        if (existingChart) existingChart.destroy();
    });

    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    Chart.defaults.color = '#94a3b8'; // slate-400
    
    // 1. Bar Chart: Kehadiran (Big Chart)
    new Chart(document.getElementById('attendanceChart'), {
        type: 'bar',
        data: {
            labels: <?= json_encode($chartDates) ?>,
            datasets: [
                { label: 'Hadir', data: <?= json_encode($chartHadir) ?>, backgroundColor: '#10b981', borderRadius: 4, barThickness: 16 },
                { label: 'Terlambat', data: <?= json_encode($chartTerlambat) ?>, backgroundColor: '#f43f5e', borderRadius: 4, barThickness: 16 }
            ]
        },
        options: { 
            responsive: true, maintainAspectRatio: false, 
            plugins: { legend: { display: false } }, 
            scales: { 
                y: { beginAtZero: true, grid: { borderDash: [4, 4], color: '#f1f5f9' }, border: {display: false} }, 
                x: { grid: { display: false }, border: {display: false} } 
            } 
        }
    });

    // 2. Line Chart: Mengaji
    new Chart(document.getElementById('mengajiChart'), {
        type: 'line',
        data: {
            labels: <?= json_encode($chartDates) ?>,
            datasets: [{
                label: 'Setoran', data: <?= json_encode($chartMengaji) ?>,
                borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', // brand-500
                borderWidth: 3, tension: 0.4, fill: true, pointRadius: 0, pointHoverRadius: 6
            }]
        },
        options: { 
            responsive: true, maintainAspectRatio: false, 
            plugins: { legend: { display: false } }, 
            scales: { y: { display: false }, x: { grid: { display: false }, border: {display: false} } } 
        }
    });

    // 3. Bar (Horizontal): Status Kerja
    new Chart(document.getElementById('statusKerjaChart'), {
        type: 'bar',
        data: {
            labels: <?= json_encode($chartStatusKerjaLabels) ?>,
            datasets: [{ data: <?= json_encode($chartStatusKerjaValues) ?>, backgroundColor: '#0ea5e9', borderRadius: 4, barThickness: 12 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { grid: { display: false }, border: {display: false} } }
        }
    });

    // Helper to handle empty charts
    function getChartData(labels, values, colors) {
        const sum = values.reduce((a, b) => a + b, 0);
        if (sum === 0) {
            return { labels: ['Belum ada data'], datasets: [{ data: [1], backgroundColor: ['#e2e8f0'], borderWidth: 0 }] };
        }
        return { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] };
    }

    const doughnutOptions = { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(context) { if(context.label === 'Belum ada data') return ' 0'; return ' ' + context.raw; } } } } };

    // 4. Doughnut: Gender
    new Chart(document.getElementById('genderChart'), { type: 'doughnut', data: getChartData(<?= json_encode($chartGenderLabels) ?>, <?= json_encode($chartGenderValues) ?>, ['#8b5cf6', '#c4b5fd', '#ede9fe']), options: doughnutOptions });

    // 5. Doughnut: Izin
    new Chart(document.getElementById('izinChart'), { type: 'doughnut', data: getChartData(<?= json_encode($chartIzinLabels) ?>, <?= json_encode($chartIzinValues) ?>, ['#f59e0b', '#fbbf24', '#fde68a']), options: doughnutOptions });

    // 6. Doughnut: Lembur
    new Chart(document.getElementById('lemburChart'), { type: 'doughnut', data: getChartData(<?= json_encode($chartLemburLabels) ?>, <?= json_encode($chartLemburValues) ?>, ['#f43f5e', '#10b981', '#64748b']), options: doughnutOptions });

    // 7. Pie: Divisi
    new Chart(document.getElementById('divisiChart'), { type: 'pie', data: getChartData(<?= json_encode($chartDivisiLabels) ?>, <?= json_encode($chartDivisiValues) ?>, ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308']), options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(context) { if(context.label === 'Belum ada data') return ' 0'; return ' ' + context.raw; } } } } } });
})();
</script>

  </main>
</div>
</body>
</html>
