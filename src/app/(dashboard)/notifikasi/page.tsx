import NotifikasiForm from "./NotifikasiForm";

export const metadata = {
  title: "Kirim Notifikasi - Great HRIS",
  description: "Broadcast push notification ke semua karyawan.",
};

export default function NotifikasiPage() {
  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 dark:text-slate-200 max-w-xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Kirim Notifikasi</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Notifikasi akan dikirim ke semua karyawan yang sudah mengaktifkan notifikasi di perangkat mereka.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <NotifikasiForm />
      </div>
    </div>
  );
}
