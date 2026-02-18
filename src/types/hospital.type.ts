// export interface Hospital {
//   name: string;
//   phoneNumber: string;
//   email: string;
//   contactPerson: string;
//   registrationNumber: string;
//   address: string;
//   city: string;
//   pincode: string;
//   url: string;
// }

//  "_id": "698da2aa9eae9bba287d0296",
//                 "name": "Sarvodaya",
//                 "phoneCountryCode": "+91",
//                 "phoneNumber": "569 334 3366",
//                 "email": "sarvodaya@gmail.com",
//                 "contactPerson": "Surya Kant Sharma",
//                 "registrationNumber": "GSTIN02-1390213",
//                 "address": "Davim",
//                 "city": "Ahmedabad",
//                 "pincode": "121001",
//                 "url": "https://sarvodaya.com",
//                 "logoUrl": "download.jpeg",
//                 "createdAt": "2026-02-12T09:51:38.225Z",
//                 "updatedAt": "2026-02-12T09:51:38.225Z",
//   "__v": 0

export interface Hospital {
  _id: string;
  name: string;
  phoneCountryCode: string;
  phoneNumber: string;
  email: string;
  contactPerson: string;
  registrationNumber: string;
  address: string;
  city: string;
  pincode: string;
  url: string;
  logoUrl: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CreateHospitalPayload {
  name: string;
  phoneCountryCode: string;
  phoneNumber: string;
  email: string;
  contactPerson: string;
  registrationNumber: string;
  address: string;
  city: string;
  pincode: string;
  url: string;
  logoUrl: string;
}
