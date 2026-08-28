declare const idBrand: unique symbol;

// Branded string so e.g. a NodeId can't be passed where a PinId is
// expected, without a runtime wrapper object -- replaces the untagged
// plain strings entities currently use as ids.
export type Id<Tag extends string> = string & { readonly [idBrand]: Tag };

export function newId<Tag extends string>(): Id<Tag> {
  return crypto.randomUUID() as Id<Tag>;
}

export function asId<Tag extends string>(raw: string): Id<Tag> {
  return raw as Id<Tag>;
}
