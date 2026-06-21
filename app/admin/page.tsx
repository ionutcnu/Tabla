import { ArrowLeft, CheckCircle2, Clock3, Download, Mail, Phone, Search, UserRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const orders = [
  {
    id: "TF-1048",
    client: "Popescu Andrei",
    phone: "0742 118 902",
    email: "andrei.popescu@email.ro",
    city: "Brasov",
    status: "Noua",
    statusTone: "bg-blue-50 text-blue-800 border-blue-200",
    product: "Tabla tip tigla 0.50 mm",
    sheets: "42 foi",
    area: "224.6 mp",
    trims: "31 profile",
    createdAt: "Azi, 10:42",
    value: "Oferta in lucru",
  },
  {
    id: "TF-1047",
    client: "Munteanu Elena",
    phone: "0728 441 220",
    email: "elena.munteanu@email.ro",
    city: "Sibiu",
    status: "Contactat",
    statusTone: "bg-amber-50 text-amber-800 border-amber-200",
    product: "Tabla cutata 0.45 mm",
    sheets: "28 foi",
    area: "149.2 mp",
    trims: "18 profile",
    createdAt: "Ieri, 16:15",
    value: "12.400 RON",
  },
  {
    id: "TF-1046",
    client: "SC Nord Construct SRL",
    phone: "0730 901 775",
    email: "office@nordconstruct.ro",
    city: "Cluj-Napoca",
    status: "Ofertata",
    statusTone: "bg-teal-50 text-teal-800 border-teal-200",
    product: "Tabla faltuita 0.60 mm",
    sheets: "76 foi",
    area: "418.9 mp",
    trims: "54 profile",
    createdAt: "18 iun, 09:08",
    value: "38.900 RON",
  },
  {
    id: "TF-1045",
    client: "Ionescu Mihai",
    phone: "0755 330 112",
    email: "mihai.ionescu@email.ro",
    city: "Ploiesti",
    status: "Acceptata",
    statusTone: "bg-green-50 text-green-800 border-green-200",
    product: "Tabla tip tigla 0.50 mm",
    sheets: "35 foi",
    area: "185.0 mp",
    trims: "25 profile",
    createdAt: "17 iun, 13:31",
    value: "16.750 RON",
  },
];

const stats = [
  { label: "Cereri noi", value: "8", hint: "ultimele 7 zile" },
  { label: "Contactate", value: "14", hint: "in lucru" },
  { label: "Ofertate", value: "21", hint: "luna curenta" },
  { label: "Valoare oferte", value: "126k RON", hint: "estimare" },
];

export default function AdminPage() {
  const selectedOrder = orders[0];

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-5 py-4 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground" href="/">
              <ArrowLeft className="size-4" />
              Inapoi la site
            </Link>
            <h1 className="text-2xl font-bold tracking-normal md:text-4xl">Panou comenzi</h1>
            <p className="mt-1 text-sm text-muted-foreground">Cereri de oferta primite prin calculatorul de tabla.</p>
          </div>
          <Button>
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
        </div>
      </header>

      <section className="grid gap-4 px-5 py-6 md:grid-cols-4 md:px-8">
        {stats.map((stat) => (
          <article className="rounded-lg border bg-card p-5 shadow-soft" key={stat.label}>
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <strong className="mt-2 block text-3xl">{stat.value}</strong>
            <span className="mt-1 block text-xs text-muted-foreground">{stat.hint}</span>
          </article>
        ))}
      </section>

      <section className="grid gap-6 px-5 pb-8 md:px-8 xl:grid-cols-[1fr_420px]">
        <div className="rounded-lg border bg-card shadow-soft">
          <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold">Toate cererile</h2>
              <p className="text-sm text-muted-foreground">Status, client, materiale si valoare estimata.</p>
            </div>
            <label className="flex min-h-11 items-center gap-2 rounded-md border bg-white px-3 text-sm text-muted-foreground md:w-72">
              <Search className="size-4" />
              <input className="w-full bg-transparent outline-none" placeholder="Cauta client sau localitate" />
            </label>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Produs</th>
                  <th className="px-4 py-3">Necesar</th>
                  <th className="px-4 py-3">Valoare</th>
                  <th className="px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr className="border-b last:border-0" key={order.id}>
                    <td className="px-4 py-4 font-semibold">{order.id}</td>
                    <td className="px-4 py-4">
                      <strong className="block">{order.client}</strong>
                      <span className="text-muted-foreground">{order.city}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${order.statusTone}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{order.product}</td>
                    <td className="px-4 py-4">
                      <strong className="block">{order.sheets}</strong>
                      <span className="text-muted-foreground">{order.area}</span>
                    </td>
                    <td className="px-4 py-4 font-semibold">{order.value}</td>
                    <td className="px-4 py-4 text-muted-foreground">{order.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {orders.map((order) => (
              <article className="rounded-lg border bg-white p-4" key={order.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong>{order.client}</strong>
                    <span className="block text-sm text-muted-foreground">
                      {order.id} | {order.city}
                    </span>
                  </div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${order.statusTone}`}>
                    {order.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <Metric label="Necesar" value={order.sheets} />
                  <Metric label="Suprafata" value={order.area} />
                  <Metric label="Profile" value={order.trims} />
                  <Metric label="Valoare" value={order.value} />
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border bg-card p-5 shadow-soft">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-primary">Cerere selectata</p>
              <h2 className="text-xl font-bold">{selectedOrder.id}</h2>
            </div>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${selectedOrder.statusTone}`}>
              {selectedOrder.status}
            </span>
          </div>

          <div className="grid gap-4">
            <InfoLine icon={<UserRound className="size-4" />} label="Client" value={selectedOrder.client} />
            <InfoLine icon={<Phone className="size-4" />} label="Telefon" value={selectedOrder.phone} />
            <InfoLine icon={<Mail className="size-4" />} label="Email" value={selectedOrder.email} />
            <InfoLine icon={<Clock3 className="size-4" />} label="Primit" value={selectedOrder.createdAt} />
          </div>

          <div className="my-5 border-t" />

          <div className="grid gap-3 text-sm">
            <Metric label="Produs" value={selectedOrder.product} />
            <Metric label="Foi calculate" value={selectedOrder.sheets} />
            <Metric label="Suprafata" value={selectedOrder.area} />
            <Metric label="Profile finisaj" value={selectedOrder.trims} />
          </div>

          <div className="mt-5 rounded-lg border bg-slate-50 p-4 text-sm text-muted-foreground">
            <strong className="mb-2 flex items-center gap-2 text-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              Urmatorul pas
            </strong>
            Verifica masuratorile cu clientul, confirma culoarea si grosimea, apoi trimite oferta finala.
          </div>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-slate-50 p-3">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <strong className="block text-foreground">{value}</strong>
    </div>
  );
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 text-primary">{icon}</span>
      <span>
        <span className="block text-muted-foreground">{label}</span>
        <strong className="block">{value}</strong>
      </span>
    </div>
  );
}
