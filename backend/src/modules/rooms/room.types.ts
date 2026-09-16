export type RoomType =
  | 'SINGLE'
  | 'DOUBLE'
  | 'TWIN'
  | 'SUITE'
  | 'DELUXE';

export interface Room {
  hotelId: string;
  roomNumber: string;
  type: RoomType;
  description: string;
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  images: string[];
  isAvailable: boolean;
}