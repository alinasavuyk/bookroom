'use client';
import { useCallback } from 'react';
import { searchCities, searchWarehouses, NovaPoshtaCity, NovaPoshtaWarehouse } from '@/lib/api-client';
import SearchSelect from '@/components/SearchSelect';
import styles from './DeliveryPicker.module.css';

interface DeliveryPickerProps {
  city: NovaPoshtaCity | null;
  warehouse: NovaPoshtaWarehouse | null;
  onCityChange: (city: NovaPoshtaCity) => void;
  onWarehouseChange: (warehouse: NovaPoshtaWarehouse) => void;
}

// Поля вибору міста й відділення Нової Пошти — спільні для оформлення
// купівлі в кошику й узгодження доставки при обміні книгами
export default function DeliveryPicker({ city, warehouse, onCityChange, onWarehouseChange }: DeliveryPickerProps) {
  const searchWarehousesForCity = useCallback(
    (query: string) => (city ? searchWarehouses(city.ref, query) : Promise.resolve([])),
    [city]
  );

  return (
    <>
      <label className={styles.fieldLabel}>
        Місто
        <SearchSelect
          placeholder="Почни вводити назву міста..."
          value={city}
          onChange={onCityChange}
          search={searchCities}
          getLabel={(c) => c.name}
          getKey={(c) => c.ref}
        />
      </label>

      <label className={styles.fieldLabel}>
        Відділення
        <SearchSelect
          placeholder={city ? 'Почни вводити номер чи адресу...' : 'Спершу обери місто'}
          value={warehouse}
          onChange={onWarehouseChange}
          search={searchWarehousesForCity}
          getLabel={(w) => w.description}
          getKey={(w) => w.ref}
          disabled={!city}
        />
      </label>
    </>
  );
}
