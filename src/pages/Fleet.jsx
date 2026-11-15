import { Car } from 'lucide-react';
import { useData } from '../context/DataContext';
import { OWNERSHIP, VEHICLE_CATEGORIES } from '../constants/domain';
import { isMercosulPlate, isValidPlate, maskPlate } from '../utils/masks';
import { vehicleTags } from '../utils/rules';
import RegistryPage from '../components/registry/RegistryPage';
import { REGISTRY_TABS } from '../components/ui/RouteTabs';

const FIELDS = [
  { key: 'brand', label: 'Marca', required: true, placeholder: 'Ex.: Toyota' },
  { key: 'model', label: 'Modelo', required: true, placeholder: 'Ex.: Corolla Altis Hybrid' },
  {
    key: 'plate',
    label: 'Placa',
    required: true,
    mask: maskPlate,
    placeholder: 'ABC1D23',
    hint: 'Padrão Mercosul (ABC1D23) ou antigo (ABC-1234).',
    validate: isValidPlate,
    invalidText: 'Placa inválida',
  },
  { key: 'year', label: 'Ano', required: true, type: 'number', placeholder: '2024' },
  { key: 'color', label: 'Cor', placeholder: 'Ex.: Preto' },
  { key: 'seats', label: 'Lugares', type: 'number', placeholder: '4' },
  { key: 'category', label: 'Categoria', required: true, type: 'select', options: VEHICLE_CATEGORIES },
  {
    key: 'ownership',
    label: 'Tipo de frota',
    required: true,
    type: 'select',
    options: Object.entries(OWNERSHIP).map(([value, label]) => ({ value, label })),
  },
  { key: 'ownerName', label: 'Proprietário / Parceiro', required: true, span: 2, placeholder: 'Nome do parceiro ou locadora', showIf: (f) => f.ownership === 'terceirizada' },
];

const EMPTY = { brand: '', model: '', plate: '', year: new Date().getFullYear(), color: '', seats: 4, category: '', ownership: 'propria', ownerName: '', active: true };

/** UC02 — Frota (veículos próprios e terceirizados) + UC06 (etiquetas e filtros). */
export default function Fleet() {
  const { db, actions } = useData();
  return (
    <RegistryPage
      title="Frota"
      subtitle="Veículos próprios e terceirizados"
      tabs={REGISTRY_TABS}
      entityLabel="Veículo"
      items={db.vehicles}
      searchText={(v) => `${v.brand} ${v.model} ${v.plate} ${v.ownerName}`}
      tagsOf={vehicleTags}
      filterTags={['Frota Própria', 'Terceirizada', ...VEHICLE_CATEGORIES]}
      row={(v) => ({
        leading: (
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal/15 text-petrol dark:text-mint">
            <Car className="h-5 w-5" />
          </span>
        ),
        title: `${v.brand} ${v.model}`,
        subtitle: `${v.plate}${isMercosulPlate(v.plate) ? ' (Mercosul)' : ''} · ${v.year} · ${v.color || '—'} · ${v.seats} lugares`,
        badges: [...vehicleTags(v), v.ownership === 'terceirizada' ? v.ownerName : null],
        trailing: `${db.services.filter((s) => s.vehicleId === v.id && s.status === 'Agendado').length} agendado(s)`,
      })}
      fields={FIELDS}
      emptyItem={EMPTY}
      save={(d) => actions.saveVehicle({ ...d, ownerName: d.ownership === 'terceirizada' ? d.ownerName : '' })}
      setActive={actions.setVehicleActive}
    />
  );
}
