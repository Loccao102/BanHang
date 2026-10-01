export type CustomerUser = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "customer" | "admin";
};

export type CustomerAddress = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  isDefault: boolean;
};
