import type { BaseDTO } from './BaseDTO.js';

export interface IMapper<TDomain, TDto extends BaseDTO> {
  toDTO(domain: TDomain): TDto;
  toDomain(dto: TDto): TDomain;
}

export abstract class BaseMapper<TDomain, TDto extends BaseDTO> implements IMapper<TDomain, TDto> {
  abstract toDTO(domain: TDomain): TDto;
  abstract toDomain(dto: TDto): TDomain;

  toDTOList(domains: TDomain[]): TDto[] {
    return domains.map((d) => this.toDTO(d));
  }

  toDomainList(dtos: TDto[]): TDomain[] {
    return dtos.map((d) => this.toDomain(d));
  }
}

export abstract class BaseReadMapper<TDomain, TDto extends BaseDTO> {
  abstract toDTO(domain: TDomain): TDto;

  toDTOList(domains: TDomain[]): TDto[] {
    return domains.map((d) => this.toDTO(d));
  }
}
