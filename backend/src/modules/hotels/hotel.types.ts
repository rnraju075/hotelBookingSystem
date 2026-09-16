export interface HotelAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface Hotel {
  name: string;
  description: string;
  address: HotelAddress;
  managerId: string;
  amenities: string[];
  images: string[];
  rating: number;
  isActive: boolean;
}