import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

interface Ward {
  Id: string;
  Name: string;
  Level: string;
}

interface District {
  Id: string;
  Name: string;
  Wards: Ward[];
}

interface Province {
  Id: string;
  Name: string;
  Districts: District[];
}

@Injectable()
export class LocationService implements OnModuleInit {
  private provinces: Province[] = [];

  async onModuleInit() {
    await this.loadLocations();
  }

  private async loadLocations() {
    try {
      const filePath = path.join(__dirname, 'vn_locations.json');
      const data = await fs.readFile(filePath, 'utf-8');
      this.provinces = JSON.parse(data) as Province[];
    } catch (error) {
      console.error('Failed to load locations json', error);
      // fallback path for local dev
      try {
        const fallbackPath = path.join(
          process.cwd(),
          'src/communication/vn_locations.json',
        );
        const data = await fs.readFile(fallbackPath, 'utf-8');
        this.provinces = JSON.parse(data) as Province[];
      } catch (err) {
        console.error('Completely failed to load locations json', err);
      }
    }
  }

  getProvinces() {
    return this.provinces.map((p) => ({ Id: p.Id, Name: p.Name }));
  }

  getDistricts(provinceId: string) {
    const province = this.provinces.find((p) => p.Id === provinceId);
    if (!province) throw new NotFoundException('Province not found');
    return province.Districts.map((d) => ({ Id: d.Id, Name: d.Name }));
  }

  getWards(provinceId: string, districtId: string) {
    const province = this.provinces.find((p) => p.Id === provinceId);
    if (!province) throw new NotFoundException('Province not found');
    const district = province.Districts.find((d) => d.Id === districtId);
    if (!district) throw new NotFoundException('District not found');
    return district.Wards.map((w) => ({
      Id: w.Id,
      Name: w.Name,
      Level: w.Level,
    }));
  }
}
