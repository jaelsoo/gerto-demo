import { Link } from 'react-router-dom';
import { ArrowRight, Car, ChevronRight, Clock, UserRound } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { serviceTags, serviceWindow } from '../../utils/rules';
import { formatCurrency, formatDate, formatTime } from '../../utils/format';
import { Badge } from '../ui/primitives';

/** Card de serviço com etiquetas visuais (UC06). */
export default function ServiceCard({ service, showDate = true, linkState }) {
  const { db } = useData();
  const client = db.clients.find((c) => c.id === service.clientId);
  const vehicle = db.vehicles.find((v) => v.id === service.vehicleId);
  const driver = db.drivers.find((d) => d.id === service.driverId);
  const { end } = serviceWindow(service);
  const tags = serviceTags(service, db);

  return (
    <Link to={`/servicos/${service.id}`} state={linkState} className="card group block p-4 transition hover:-translate-y-0.5 hover:border-teal/50">
      <div className="flex items-start gap-3">
        <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-surface py-2 text-center">
          <span className="text-[15px] font-bold text-ink">{service.time}</span>
          <span className="text-[10.5px] text-muted">{formatTime(end)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-ink">{client?.name || 'Cliente removido'}</p>
          </div>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-muted">
            <span className="truncate">{service.origin}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{service.destination}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
            <span className="font-medium text-ink/80">nº {service.id}</span>
            {showDate && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatDate(service.date)}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Car className="h-3.5 w-3.5" /> {vehicle ? `${vehicle.model} · ${vehicle.plate}` : '—'}
            </span>
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5" /> {driver?.name || '—'}
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-[14px] font-semibold text-ink">{formatCurrency(service.value)}</span>
          <ChevronRight className="h-5 w-5 text-muted/60 transition group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
