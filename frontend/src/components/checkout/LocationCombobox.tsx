import React, { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";

export interface LocationData {
  provinceId: string;
  provinceName: string;
  districtId: string;
  districtName: string;
  wardId: string;
  wardName: string;
}

interface LocationComboboxProps {
  onLocationChange: (location: LocationData) => void;
}

export function LocationCombobox({ onLocationChange }: LocationComboboxProps) {
  const [provinces, setProvinces] = useState<{ Id: string; Name: string }[]>(
    [],
  );
  const [districts, setDistricts] = useState<{ Id: string; Name: string }[]>(
    [],
  );
  const [wards, setWards] = useState<{ Id: string; Name: string }[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  // Fetch provinces on mount
  useEffect(() => {
    fetchApi<{ Id: string; Name: string }[]>("/locations/provinces")
      .then(setProvinces)
      .catch(console.error);
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      fetchApi<{ Id: string; Name: string }[]>(
        `/locations/provinces/${selectedProvince}/districts`,
      )
        .then(setDistricts)
        .catch(console.error);
    }
  }, [selectedProvince]);

  // Fetch wards when district changes
  useEffect(() => {
    if (selectedProvince && selectedDistrict) {
      fetchApi<{ Id: string; Name: string }[]>(
        `/locations/provinces/${selectedProvince}/districts/${selectedDistrict}/wards`,
      )
        .then(setWards)
        .catch(console.error);
    }
  }, [selectedProvince, selectedDistrict]);

  // Notify parent
  useEffect(() => {
    if (selectedProvince && selectedDistrict && selectedWard) {
      const p = provinces.find((x) => x.Id === selectedProvince);
      const d = districts.find((x) => x.Id === selectedDistrict);
      const w = wards.find((x) => x.Id === selectedWard);
      if (p && d && w) {
        onLocationChange({
          provinceId: p.Id,
          provinceName: p.Name,
          districtId: d.Id,
          districtName: d.Name,
          wardId: w.Id,
          wardName: w.Name,
        });
      }
    }
  }, [
    selectedProvince,
    selectedDistrict,
    selectedWard,
    provinces,
    districts,
    wards,
    onLocationChange,
  ]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvince(e.target.value);
    setSelectedDistrict("");
    setWards([]);
    setSelectedWard("");
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDistrict(e.target.value);
    setSelectedWard("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="text-xs font-bold block mb-1">Tỉnh / Thành phố</label>
        <select
          className="glass-input cursor-pointer"
          value={selectedProvince}
          onChange={handleProvinceChange}
        >
          <option value="">-- Chọn Tỉnh --</option>
          {provinces.map((p) => (
            <option key={p.Id} value={p.Id}>
              {p.Name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-bold block mb-1">Quận / Huyện</label>
        <select
          className="glass-input cursor-pointer"
          value={selectedDistrict}
          onChange={handleDistrictChange}
          disabled={!selectedProvince}
        >
          <option value="">-- Chọn Huyện --</option>
          {districts.map((d) => (
            <option key={d.Id} value={d.Id}>
              {d.Name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-bold block mb-1">Phường / Xã</label>
        <select
          className="glass-input cursor-pointer"
          value={selectedWard}
          onChange={(e) => setSelectedWard(e.target.value)}
          disabled={!selectedDistrict}
        >
          <option value="">-- Chọn Xã --</option>
          {wards.map((w) => (
            <option key={w.Id} value={w.Id}>
              {w.Name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
