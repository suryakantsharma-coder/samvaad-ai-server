import { FilterIcon, SearchIcon } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../../../../components/ui/toggle-group";

const filterTabs = [
  { id: "all", label: "All" },
  { id: "today", label: "Today (4)" },
  { id: "upcoming", label: "Upcoming (15)" },
  { id: "completed", label: "Completed (670)" },
  { id: "cancelled", label: "Cancelled (110)" },
];

export const PrescriptionsFilterSection = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <section className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full">
      <ToggleGroup
        type="single"
        value={activeTab}
        onValueChange={setActiveTab}
        className="inline-flex items-center gap-[15px] p-[3px] bg-white rounded-[100px]"
      >
        {filterTabs.map((tab) => (
          <ToggleGroupItem
            key={tab.id}
            value={tab.id}
            className="inline-flex items-center justify-center gap-[5px] px-5 py-[5px] rounded-[100px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] data-[state=on]:bg-primary-2 data-[state=on]:text-white bg-transparent text-x-70"
          >
            {tab.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="flex flex-wrap items-center gap-[15px]">
        <div className="flex w-full lg:w-[372px] items-center gap-2.5 px-2 py-2 bg-white rounded-[100px] h-[38px]">
          <SearchIcon className="w-6 h-6 text-black opacity-70" />
          <Input
            placeholder="Search patient...."
            className="flex-1 border-0 bg-transparent opacity-70 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          />
        </div>

        <Select>
          <SelectTrigger className="flex w-[107px] items-center justify-between px-[15px] py-2 bg-white rounded-[100px] border-0 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          className="inline-flex items-center gap-[5px] px-2.5 py-1.5 bg-white rounded-[100px] hover:bg-white"
        >
          <FilterIcon className="w-6 h-6" />
          <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
            Filter
          </span>
        </Button>

        <div className="inline-flex items-center p-0.5 bg-white rounded-[100px]">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-grey-light"
          >
            <img alt="List view" src="/frame-2147229233.svg" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-grey-light"
          >
            <img alt="Grid view" src="/frame-2147229236.svg" />
          </Button>
        </div>
      </div>
    </section>
  );
};
