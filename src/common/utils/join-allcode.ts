import { SelectQueryBuilder } from 'typeorm';
import { permissionCommonFields } from './CommonField';

export function joinWithCommonFields(
  qb: SelectQueryBuilder<any>,
  relationPath: string,
  alias: string,
  commonFields = permissionCommonFields,
) {
  qb.leftJoin(relationPath, alias);
  qb.addSelect(commonFields.map((f) => `${alias}.${f}`));
  return qb;
}
