import {
  Filter as FilterIcon,
  LayoutGrid,
  List,
  Mail as MailIcon,
  MoreVertical as MoreVerticalIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import { Input } from "../../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { ListError } from "../../../../components/ui/list-error";
import { LoadingSpinner } from "../../../../components/ui/loading-spinner";
import { API_BASE_URL } from "../../../../config";
import { useHospital } from "../../../../contexts/HospitalProvider";
import { Hospital } from "../../../../types/hospital.type";

export interface HospitalRow {
  id: string;
  name: string;
  hospitalId: string;
  iconBg: string;
  iconName: string;
  phone: string;
  email: string;
  contactPerson: string;
  gstRegistration: string;
  url: string;
}

const hospitalsDummyData: HospitalRow[] = [
  {
    id: "1",
    name: "CityCare Health Center",
    hospitalId: "HSP-1005",
    iconBg: "bg-red-100",
    iconName: "cross",
    phone: "+91 3456728902",
    email: "citycare@hospital.com",
    contactPerson: "Sophia Adams",
    gstRegistration: "27AACCC8456M1Z2",
    url: "www.citycarehealth.in",
  },
  {
    id: "2",
    name: "MedBridge SuperCare",
    hospitalId: "HSP-1005",
    iconBg: "bg-sky-100",
    iconName: "building",
    phone: "+91 3456728902",
    email: "citycare@hospital.com",
    contactPerson: "Sophia Adams",
    gstRegistration: "27AACCC8456M1Z2",
    url: "www.citycarehealth.in",
  },
  {
    id: "3",
    name: "HealWell Clinic",
    hospitalId: "HSP-1005",
    iconBg: "bg-blue-100",
    iconName: "shield",
    phone: "+91 5678234570",
    email: "healwell@hospital.com",
    contactPerson: "Olivia Turner",
    gstRegistration: "29AABCH2345K1Z5",
    url: "www.citycarehealth.in",
  },
  {
    id: "4",
    name: "CareFirst Hospital",
    hospitalId: "HSP-1005",
    iconBg: "bg-red-50",
    iconName: "cross",
    phone: "+91 7834071117",
    email: "citycare@hospital.com",
    contactPerson: "Sofia Finland",
    gstRegistration: "27AACCC8456M1Z2",
    url: "www.citycarehealth.in",
  },
  {
    id: "5",
    name: "LifeSpring Multispeciality",
    hospitalId: "HSP-1005",
    iconBg: "bg-emerald-100",
    iconName: "leaf",
    phone: "+91 3456728902",
    email: "citycare@hospital.com",
    contactPerson: "Joe cupper",
    gstRegistration: "27AACCC8456M1Z2",
    url: "www.citycarehealth.in",
  },
  {
    id: "6",
    name: "Sunrise Medical Institute",
    hospitalId: "HSP-1005",
    iconBg: "bg-violet-100",
    iconName: "sun",
    phone: "+91 5824906437",
    email: "citycare@hospital.com",
    contactPerson: "James Miller",
    gstRegistration: "9AAECS9901P1Z7",
    url: "www.citycarehealth.in",
  },
  {
    id: "7",
    name: "NovaLife Health Hub",
    hospitalId: "HSP-1005",
    iconBg: "bg-green-100",
    iconName: "heart",
    phone: "+91 3456728902",
    email: "citycare@hospital.com",
    contactPerson: "Mills Willer",
    gstRegistration: "27AACCC8456M1Z2",
    url: "www.citycarehealth.in",
  },
];

const HospitalIcon = ({
  iconBg,
  iconName,
}: {
  iconBg: string;
  iconName: string;
}) => (
  <div
    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}
    aria-hidden
  >
    {iconName === "cross" && (
      <span className="text-red-600 font-bold text-lg leading-none">+</span>
    )}
    {iconName === "building" && (
      <svg
        className="w-5 h-5 text-sky-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    )}
    {iconName === "shield" && (
      <svg
        className="w-5 h-5 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    )}
    {iconName === "leaf" && (
      <svg
        className="w-5 h-5 text-emerald-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    )}
    {iconName === "sun" && (
      <svg
        className="w-5 h-5 text-violet-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    )}
    {iconName === "heart" && (
      <svg
        className="w-5 h-5 text-green-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    )}
    {iconName && (
      <img
        src={`${API_BASE_URL}${iconName}`}
        alt="logo"
        className="w-9 h-9 object-cover rounded-full"
      />
    )}
  </div>
);

export const HospitalListSection = (): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const {
    hospitals,
    searchedHospitals,
    isLoading,
    error,
    handleGetHospitals,
    handleSearchHospitals,
    resetSearchedHospitals,
  } = useHospital();

  const listToShow =
    searchQuery.trim() === "" ? hospitals : (searchedHospitals ?? []);

  useEffect(() => {
    handleGetHospitals();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearchHospitals(searchQuery);
      } else {
        resetSearchedHospitals();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const showLoading = isLoading && hospitals.length === 0 && listToShow.length === 0;
  const showError = error && !isLoading;

  if (showLoading) {
    return (
      <section className="flex flex-col bg-white rounded-[10px] overflow-hidden">
        <LoadingSpinner />
      </section>
    );
  }
  if (showError) {
    return (
      <section className="flex flex-col bg-white rounded-[10px] overflow-hidden">
        <ListError message={error} />
      </section>
    );
  }

  return (
    <section className="flex flex-col bg-white rounded-[10px] overflow-hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-5 md:px-6 pt-5 md:pt-6 pb-[26px]">
        <div className="flex w-full lg:max-w-[372px] items-center gap-2.5 px-3 py-2 bg-grey-light rounded-[100px] h-[38px]">
          <SearchIcon className="w-5 h-5 text-black opacity-70 shrink-0" />
          <Input
            placeholder="Search by hospital name, ID, or GST..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-0 bg-transparent opacity-70 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto min-w-0"
          />
        </div>

        <div className="flex flex-wrap items-center gap-[15px]">
          <Button
            variant="ghost"
            className="inline-flex items-center gap-[5px] px-2.5 py-1.5 bg-grey-light rounded-[100px] hover:bg-grey-light border-0"
          >
            <FilterIcon className="w-6 h-6" />
            <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              Filter
            </span>
          </Button>

          <div className="inline-flex items-center p-[2px] bg-grey-light rounded-[100px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={`h-8 w-8 rounded-full shrink-0 ${
                viewMode === "list"
                  ? "bg-primary-2 text-white hover:bg-primary-2 hover:text-white"
                  : "hover:bg-white text-black"
              }`}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`h-8 w-8 rounded-full shrink-0 ${
                viewMode === "grid"
                  ? "bg-primary-2 text-white hover:bg-primary-2 hover:text-white"
                  : "hover:bg-white text-black"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col overflow-x-auto -mx-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-grey-dark hover:bg-grey-dark border-0">
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Hospital Name
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Phone Number
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Email Address
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Contact Person
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                GST/Registration No.
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Hospital URL
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listToShow.map((hospital: Hospital) => (
              <TableRow
                key={hospital._id}
                className="border-b border-[#dedee1] hover:bg-grey-light/50"
              >
                <TableCell className="p-[0px]">
                  <div className="flex items-center gap-[10px] px-[20px] py-[16px]">
                    <HospitalIcon
                      iconBg={hospital.logoUrl}
                      iconName={hospital.logoUrl}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-title-4l text-black font-medium text-[14px] leading-[19px] font-[number:var(--title-4l-font-weight)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                        {hospital.name}
                      </span>
                      <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] tracking-[var(--title-5l-letter-spacing)] leading-[var(--title-5l-line-height)] [font-style:var(--title-5l-font-style)]">
                        ID - {hospital.registrationNumber}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="p-[0px]">
                  <div className="inline-flex items-center gap-[5px] px-[20px] py-[16px]">
                    <PhoneIcon className="w-4 h-4 text-black shrink-0" />
                    <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                      {hospital.phoneNumber}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="p-[0px]">
                  <div className="inline-flex items-center gap-[5px] px-[20px] py-[16px]">
                    <MailIcon className="w-4 h-4 text-black shrink-0" />
                    <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                      {hospital.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="p-[0px]">
                  <span className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                    {hospital.contactPerson}
                  </span>
                </TableCell>
                <TableCell className="p-[0px]">
                  <span className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                    {hospital.registrationNumber}
                  </span>
                </TableCell>
                <TableCell className="p-[0px]">
                  <a
                    href={`https://${hospital.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-[#0077b6] text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] underline hover:text-[#005f8c] [font-style:var(--title-4l-font-style)]"
                  >
                    {hospital.url}
                  </a>
                </TableCell>
                <TableCell className="px-[20px] py-[16px]">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-grey-light"
                      >
                        <MoreVerticalIcon className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Hospital</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Remove Hospital
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};
