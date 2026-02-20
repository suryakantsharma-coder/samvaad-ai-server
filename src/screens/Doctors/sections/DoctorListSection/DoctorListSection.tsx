import {
  Filter as FilterIcon,
  Mail as MailIcon,
  MoreVertical as MoreVerticalIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../components/ui/avatar";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import { Input } from "../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
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
import { useDoctor } from "../../../../contexts/DoctorProvider";

const doctorsData = [
  {
    name: "Dr. Olivia Turner",
    id: "MD-2024-156789",
    avatar: "/ellipse-1.png",
    phone: "+91 3456728902",
    email: "oliviaturner@hospital.com",
    designation: "Cardiologist",
    availability: "9 AM–5 PM",
    status: "On Duty",
    statusColor: "bg-[#d0f5e6] text-[#00c896]",
    utilization: 55,
  },
  {
    name: "Dr. Liam Brooks",
    id: "MD-2024-156789",
    avatar: "/ellipse-1.png",
    phone: "+91 3456728902",
    email: "liambrooke@hospital.com",
    designation: "General Physician",
    availability: "9 AM–5 PM",
    status: "On Break",
    statusColor: "bg-[#fff5e6] text-[#ff9800]",
    utilization: 95,
  },
  {
    name: "Dr. Emily Cooper",
    id: "MD-2024-156789",
    avatar: "/ellipse-1.png",
    phone: "+91 3456728902",
    email: "emilycooper@hospital.com",
    designation: "Pediatrician",
    availability: "9 AM–5 PM",
    status: "On Duty",
    statusColor: "bg-[#d0f5e6] text-[#00c896]",
    utilization: 85,
  },
  {
    name: "Dr. Ethan Miller",
    id: "MD-2024-156789",
    avatar: "/ellipse-1.png",
    phone: "+91 3456728902",
    email: "ethanmiller@hospital.com",
    designation: "Dermatologist",
    availability: "9 AM–5 PM",
    status: "Off Duty",
    statusColor: "bg-[#ffe9e9] text-[#ff0004]",
    utilization: 85,
  },
  {
    name: "Dr. Daniel Reed",
    id: "MD-2024-156789",
    avatar: "/ellipse-1.png",
    phone: "+91 3456728902",
    email: "danielreed@hospital.com",
    designation: "Neurologist",
    availability: "9 AM–5 PM",
    status: "On Leave",
    statusColor: "bg-[#e6e6e6] text-[#757575]",
    utilization: 85,
  },
  {
    name: "Dr. Ava Johnson",
    id: "MD-2024-156789",
    avatar: "/ellipse-1.png",
    phone: "+91 3456728902",
    email: "avajohnson@hospital.com",
    designation: "Gynecologist",
    availability: "9 AM–5 PM",
    status: "On Duty",
    statusColor: "bg-[#d0f5e6] text-[#00c896]",
    utilization: 85,
  },
  {
    name: "Dr. James Parker",
    id: "MD-2024-156789",
    avatar: "/ellipse-1.png",
    phone: "+91 3456728902",
    email: "jamesparker@hospital.com",
    designation: "Psychiatrist",
    availability: "9 AM–5 PM",
    status: "On Leave",
    statusColor: "bg-[#e6e6e6] text-[#757575]",
    utilization: 85,
  },
  {
    name: "Dr. Noah Carter",
    id: "MD-2024-156789",
    avatar: "/ellipse-1.png",
    phone: "+91 3456728902",
    email: "noahcarter@hospital.com",
    designation: "Cardiologist",
    availability: "9 AM–5 PM",
    status: "On Duty",
    statusColor: "bg-[#d0f5e6] text-[#00c896]",
    utilization: 85,
  },
];

// create status color map make it function
const getStatusColor = (status: string) => {
  switch (status) {
    case "On Duty":
      return "bg-[#d0f5e6] text-[#00c896]";
    case "On Break":
      return "bg-[#fff5e6] text-[#ff9800]";
    case "Off Duty":
      return "bg-[#ffe9e9] text-[#ff0004]";
    case "On Leave":
      return "bg-[#e6e6e6] text-[#757575]";
  }
};

export const DoctorListSection = (): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    doctors,
    searchedDoctors,
    loading,
    error,
    page,
    limit,
    getDoctorsData,
    searchDoctorsByName,
    resetSearchedDoctors,
  } = useDoctor();

  const listToShow =
    searchQuery.trim() === ""
      ? doctors
      : searchedDoctors ?? [];

  useEffect(() => {
    getDoctorsData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchDoctorsByName(searchQuery);
      } else {
        resetSearchedDoctors();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const showLoading = loading && doctors.length === 0 && listToShow.length === 0;
  const showError = error && !loading;

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

  //  10:00 AM - 1:00 PM&#x2F;n2:00 AM - 6:00 PM make function to split the string and return the array of strings
  const splitAvailability = (availability: string) => {
    return availability.split("&#x2F;n").map((item) => item.trim());
  };

  return (
    <section className="flex flex-col bg-white rounded-[10px] overflow-hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-5 md:px-6 pt-5 md:pt-6 pb-[26px]">
        <div className="flex w-full lg:w-[500px] items-center gap-2.5 px-[8px] py-[6px] bg-grey-light rounded-[100px] h-[38px]">
          <SearchIcon className="w-6 h-6 text-black opacity-70" />
          <Input
            placeholder="Search by patient name, ID, or visit reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-0 bg-transparent opacity-70 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          />
        </div>

        <div className="flex flex-wrap items-center gap-[15px]">
          <Select>
            <SelectTrigger className="flex w-[107px] items-center justify-between px-[15px] py-2 bg-grey-light rounded-[100px] border-0 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="on-duty">On Duty</SelectItem>
              <SelectItem value="on-break">On Break</SelectItem>
              <SelectItem value="off-duty">Off Duty</SelectItem>
              <SelectItem value="on-leave">On Leave</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            className="inline-flex items-center gap-[5px] px-2.5 py-1.5 bg-grey-light rounded-[100px] hover:bg-grey-light"
          >
            <FilterIcon className="w-6 h-6" />
            <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              Filter
            </span>
          </Button>

          {/* <div className="inline-flex items-center p-[2px] bg-grey-light rounded-[100px]">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white"
            >
              <img alt="List view" src="/frame-2147229233.svg" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white"
            >
              <img alt="Grid view" src="/frame-2147229236.svg" />
            </Button>
          </div> */}
        </div>
      </div>

      <div className="flex flex-col overflow-x-auto -mx-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-grey-dark hover:bg-grey-dark border-0">
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Doctor Name
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Phone Number
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Email Address
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Designation
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Availability
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Status
              </TableHead>
              {/* <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Utilization
              </TableHead> */}
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listToShow.map((doctor, index) => (
              <TableRow
                key={index}
                className="border-b border-[#dedee1] hover:bg-grey-light/50"
              >
                <TableCell className="p-[0px]">
                  <div className="flex items-center gap-[10px] px-[20px] py-[16px]">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={doctor.profileImage}
                        alt={doctor.fullName}
                      />
                      <AvatarFallback>
                        {doctor.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-title-4l text-black font-medium text-[14px] leading-[19px] font-[number:var(--title-4l-font-weight)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                        {doctor.fullName}
                      </span>
                      <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] tracking-[var(--title-5l-letter-spacing)] leading-[var(--title-5l-line-height)] [font-style:var(--title-5l-font-style)]">
                        {doctor.doctorId}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="p-[0px]">
                  <div className="inline-flex items-center gap-[5px] px-[20px] py-[16px]">
                    <PhoneIcon className="w-4 h-4" />
                    <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                      {doctor.phoneNumber}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="p-[0px]">
                  <div className="inline-flex items-center gap-[5px] px-[20px] py-[16px]">
                    <MailIcon className="w-4 h-4" />
                    <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                      {doctor.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="p-[0px]">
                  <span className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                    {doctor.designation}
                  </span>
                </TableCell>
                <TableCell className="p-[0px]">
                  <span className="font-title-4l flex flex-col gap-2 px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                    {splitAvailability(doctor.availability).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </span>
                </TableCell>
                <TableCell className="p-[0px]">
                  <Badge
                    className={`${getStatusColor(
                      doctor.status as string,
                    )} rounded-[100px] px-[20px] py-[5px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] hover:${getStatusColor(
                      doctor.status as string,
                    )}`}
                  >
                    {doctor.status}
                  </Badge>
                </TableCell>
                {/* <TableCell className="p-[0px]">
                  <div className="flex flex-col gap-[3px] px-[20px] py-[16px]">
                    <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                      {doctor.utilization}%
                    </span>
                    <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] tracking-[var(--title-5l-letter-spacing)] leading-[var(--title-5l-line-height)] [font-style:var(--title-5l-font-style)]">
                      of today's booked slots
                    </span>
                  </div>
                </TableCell> */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVerticalIcon className="h-6 w-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Edit Details</DropdownMenuItem>
                      <DropdownMenuItem>View Schedule</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Remove Doctor
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
