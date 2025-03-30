import ShippingAddressCard from "@/components/store/cards/address-card";
import { UserShippingAddressType } from "@/lib/types";
import { Country, ShippingAddress } from "@prisma/client";
import { Dispatch, FC, SetStateAction, useEffect } from "react";

interface Props {
  addresses: UserShippingAddressType[];
  countries: Country[];
  selectedAddress: ShippingAddress | null;
  setSelectedAddress: Dispatch<SetStateAction<ShippingAddress | null>>;
}

const AddressList: FC<Props> = ({
  addresses,
  countries,
  selectedAddress,
  setSelectedAddress,
}) => {
  useEffect(() => {
    const defaultAddress = addresses.find((address) => address.default);
    if (defaultAddress) {
      setSelectedAddress(defaultAddress);
    }
  }, [addresses]);

  const haneldeAddressSelect = (address: ShippingAddress) => {
    setSelectedAddress(address);
  };
  return (
    <div className="space-y-5 max-h-80 overflow-y-auto">
      {addresses.map((address) => (
        <ShippingAddressCard
          key={address.id}
          address={address}
          countries={countries}
          isSelected={selectedAddress?.id === address.id}
          onSelect={() => haneldeAddressSelect(address)}
        />
      ))}
    </div>
  );
};

export default AddressList;
