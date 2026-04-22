import { Controller, Get, Param } from '@nestjs/common';
import { LocationService } from './location.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Unprotected } from 'nest-keycloak-connect';

@ApiTags('Locations')
@Controller('locations')
@Unprotected()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('provinces')
  @ApiOperation({ summary: 'Get all provinces' })
  getProvinces() {
    return this.locationService.getProvinces();
  }

  @Get('provinces/:provinceId/districts')
  @ApiOperation({ summary: 'Get districts by province ID' })
  getDistricts(@Param('provinceId') provinceId: string) {
    return this.locationService.getDistricts(provinceId);
  }

  @Get('provinces/:provinceId/districts/:districtId/wards')
  @ApiOperation({ summary: 'Get wards by province and district ID' })
  getWards(
    @Param('provinceId') provinceId: string,
    @Param('districtId') districtId: string,
  ) {
    return this.locationService.getWards(provinceId, districtId);
  }
}
