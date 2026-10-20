export type FlagSoftDeletePayload = {
  isDeleted: true;
  deletedAt: Date;
  deletedBy?: string;
};

export type TimestampSoftDeletePayload = {
  deletedAt: Date;
  deletedBy?: string;
};

export function markFlagSoftDeleted(deletedBy?: string): FlagSoftDeletePayload {
  return {
    isDeleted: true,
    deletedAt: new Date(),
    ...(deletedBy ? { deletedBy } : {}),
  };
}

export function markTimestampSoftDeleted(deletedBy?: string): TimestampSoftDeletePayload {
  return {
    deletedAt: new Date(),
    ...(deletedBy ? { deletedBy } : {}),
  };
}
