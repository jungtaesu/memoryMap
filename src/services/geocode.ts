type Regions = {
  region1?: string;
  region2?: string;
  region3?: string;
  formattedAddress?: string;
};

export async function reverseGeocodeGoogle(
  lat: number,
  lng: number,
  apiKey: string
): Promise<Regions | null> {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}` +
    `&language=ko&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const first = data?.results?.[0];
  if (!first) return null;

  const components: any[] = first.address_components ?? [];

  const get = (type: string) =>
    components.find((c) => (c.types || []).includes(type))?.long_name as string | undefined;

  // Google 타입 매핑(한국 기준으로 대체로 맞음)
  const region1 = get("administrative_area_level_1"); // 시/도
  const region2 =
    get("locality") || get("administrative_area_level_2") || get("sublocality_level_1"); // 시/군/구 케이스 다양
  const region3 =
    get("sublocality_level_2") || get("sublocality") || get("neighborhood"); // 동/읍/면/동네

  return {
    region1,
    region2,
    region3,
    formattedAddress: first.formatted_address,
  };
}
