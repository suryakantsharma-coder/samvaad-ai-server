import {
  Crown,
  Filter as FilterIcon,
  Heart,
  LayoutGrid,
  List,
  MoreVertical as MoreVerticalIcon,
  Search as SearchIcon,
  Star,
} from "lucide-react";
import React, { useState } from "react";
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

export type PlanType = "Premium" | "Standard" | "Basic";
export type PaymentStatus = "Paid" | "Pending";
export type RenewalType = "Auto Debit" | "Manually";

export interface SubscriptionRow {
  id: string;
  hospitalName: string;
  iconBg: string;
  iconName: string;
  plan: PlanType;
  price: string;
  pricePeriod: "month" | "year";
  startDate: string;
  endDate: string;
  status: PaymentStatus;
  renewal: RenewalType;
}

const subscriptionsDummyData: SubscriptionRow[] = [
  {
    id: "1",
    hospitalName: "CityCare Health Center",
    iconBg: "bg-sky-100",
    iconName: "cross",
    plan: "Premium",
    price: "4,999",
    pricePeriod: "month",
    startDate: "15 Nov, 2025",
    endDate: "15 Nov, 2026",
    status: "Paid",
    renewal: "Auto Debit",
  },
  {
    id: "2",
    hospitalName: "MedBridge SuperCare",
    iconBg: "bg-blue-100",
    iconName: "shield",
    plan: "Standard",
    price: "59,999",
    pricePeriod: "year",
    startDate: "15 Nov, 2025",
    endDate: "15 Nov, 2026",
    status: "Pending",
    renewal: "Manually",
  },
  {
    id: "3",
    hospitalName: "HealWell Clinic",
    iconBg: "bg-emerald-100",
    iconName: "leaf",
    plan: "Basic",
    price: "2,999",
    pricePeriod: "month",
    startDate: "15 Nov, 2025",
    endDate: "15 Nov, 2026",
    status: "Paid",
    renewal: "Auto Debit",
  },
  {
    id: "4",
    hospitalName: "CareFirst Hospital",
    iconBg: "bg-blue-50",
    iconName: "heart",
    plan: "Standard",
    price: "99,999",
    pricePeriod: "year",
    startDate: "15 Nov, 2025",
    endDate: "15 Nov, 2026",
    status: "Pending",
    renewal: "Manually",
  },
  {
    id: "5",
    hospitalName: "LifeSpring Multispeciality",
    iconBg: "bg-red-50",
    iconName: "leaf",
    plan: "Premium",
    price: "99,999",
    pricePeriod: "year",
    startDate: "15 Nov, 2025",
    endDate: "15 Nov, 2026",
    status: "Paid",
    renewal: "Auto Debit",
  },
  {
    id: "6",
    hospitalName: "Sunrise Medical Institute",
    iconBg: "bg-red-100",
    iconName: "heart",
    plan: "Basic",
    price: "59,999",
    pricePeriod: "year",
    startDate: "15 Nov, 2025",
    endDate: "15 Nov, 2026",
    status: "Pending",
    renewal: "Manually",
  },
  {
    id: "7",
    hospitalName: "NovaLife Health Hub",
    iconBg: "bg-teal-100",
    iconName: "heart",
    plan: "Premium",
    price: "4,999",
    pricePeriod: "month",
    startDate: "15 Nov, 2025",
    endDate: "15 Nov, 2026",
    status: "Paid",
    renewal: "Auto Debit",
  },
  {
    id: "8",
    hospitalName: "CityCare Health Center",
    iconBg: "bg-sky-100",
    iconName: "cross",
    plan: "Premium",
    price: "4,999",
    pricePeriod: "month",
    startDate: "15 Nov, 2025",
    endDate: "15 Nov, 2026",
    status: "Paid",
    renewal: "Auto Debit",
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
      <span className="text-sky-600 font-bold text-lg leading-none">+</span>
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
    {iconName === "heart" && (
      <svg
        className="w-5 h-5 text-red-500"
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
  </div>
);

const planBadgeConfig: Record<
  PlanType,
  { className: string; icon: React.ReactNode }
> = {
  Premium: {
    className: "bg-[#d0f5e6] text-[#00c896] hover:bg-[#d0f5e6]",
    icon: <Crown className="w-4 h-4" />,
  },
  Standard: {
    className: "bg-[#d5eaff] text-[#007cff] hover:bg-[#d5eaff]",
    icon: <Star className="w-4 h-4" />,
  },
  Basic: {
    className: "bg-[#fff1e0] text-[#ff9000] hover:bg-[#fff1e0]",
    icon: <Heart className="w-4 h-4" />,
  },
};

const statusBadgeConfig: Record<
  PaymentStatus,
  { className: string }
> = {
  Paid: { className: "bg-[#d0f5e6] text-[#00c896] hover:bg-[#d0f5e6]" },
  Pending: { className: "bg-[#fff5e6] text-[#ff9800] hover:bg-[#fff5e6]" },
};

export const PaymentListSection = (): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  return (
    <section className="flex flex-col bg-white rounded-[10px] overflow-hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-5 md:px-6 pt-5 md:pt-6 pb-[26px]">
        <div className="flex w-full lg:max-w-[372px] items-center gap-2.5 px-3 py-2 bg-grey-light rounded-[100px] h-[38px]">
          <SearchIcon className="w-5 h-5 text-black opacity-70 shrink-0" />
          <Input
            placeholder="Search by hospital name, plan,..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-0 bg-transparent opacity-70 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto min-w-0"
          />
        </div>

        <div className="flex flex-wrap items-center gap-[15px]">
          <Select>
            <SelectTrigger className="flex w-[107px] items-center justify-between px-[15px] py-2 bg-grey-light rounded-[100px] border-0 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

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
                Plan
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Price
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Start Date
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                End Date
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Status
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Renewal
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptionsDummyData.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-[#dedee1] hover:bg-grey-light/50"
              >
                <TableCell className="p-[0px]">
                  <div className="flex items-center gap-[10px] px-[20px] py-[16px]">
                    <HospitalIcon
                      iconBg={row.iconBg}
                      iconName={row.iconName}
                    />
                    <span className="font-title-4l text-black font-medium text-[14px] leading-[19px] font-[number:var(--title-4l-font-weight)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                      {row.hospitalName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="p-[0px]">
                  <div className="px-[20px] py-[16px]">
                    <Badge
                      className={`inline-flex items-center gap-1.5 rounded-[100px] px-2.5 py-[5px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] [font-style:var(--title-4r-font-style)] ${planBadgeConfig[row.plan].className}`}
                    >
                      {planBadgeConfig[row.plan].icon}
                      {row.plan}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="p-[0px]">
                  <span className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                    ₹{row.price} / {row.pricePeriod === "month" ? "month" : "year"}
                  </span>
                </TableCell>
                <TableCell className="p-[0px]">
                  <span className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                    {row.startDate}
                  </span>
                </TableCell>
                <TableCell className="p-[0px]">
                  <span className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                    {row.endDate}
                  </span>
                </TableCell>
                <TableCell className="p-[0px]">
                  <div className="px-[20px] py-[16px]">
                    <Badge
                      className={`rounded-[100px] px-2.5 py-[5px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] [font-style:var(--title-4r-font-style)] ${statusBadgeConfig[row.status].className}`}
                    >
                      {row.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="p-[0px]">
                  <span className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                    {row.renewal}
                  </span>
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
                      <DropdownMenuItem>Edit Subscription</DropdownMenuItem>
                      <DropdownMenuItem>Renew</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Cancel Subscription
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
