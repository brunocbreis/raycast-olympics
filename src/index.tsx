import { Detail, List, showToast, Toast } from "@raycast/api";
import axios from "axios";
import cheerio from "cheerio";
import { useState, useEffect } from "react";

const url = "https://en.wikipedia.org/wiki/2024_Summer_Olympics_medal_table#Medal_table";

interface MedalTableEntry {
  country: Country;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

interface Country {
  name: string;
  flag: string;
}

const countries: Country[] = [
  { name: "Brazil", flag: "🇧🇷" },
  { name: "United States", flag: "🇺🇸" },
  { name: "Ireland", flag: "🇮🇪" },
  { name: "Great Britain", flag: "🇬🇧" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "France", flag: "🇫🇷" },
  { name: "Switzerland", flag: "🇨🇭" },
  { name: "Netherlands", flag: "🇳🇱" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Denmark", flag: "🇩🇰" },
  { name: "Norway", flag: "🇳🇴" },
  { name: "Sweden", flag: "🇸🇪" },
  { name: "Poland", flag: "🇵🇱" },
  { name: "Serbia", flag: "🇷🇸" },
  { name: "Lithuania", flag: "🇱🇹" },
  { name: "Romania", flag: "🇷🇴" },
];

function countryByName(name: string): Country | null {
  for (let index = 0; index < countries.length; index++) {
    const element = countries[index];
    if (element.name === name) {
      return element;
    }
  }
  return null;
}

async function fetchMedalTable(): Promise<MedalTableEntry[]> {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const medalTable: MedalTableEntry[] = [];

    let lastRank = ""; // To store the last non-empty rank

    $("table.wikitable.sortable tbody tr").each((index, element) => {
      // Get the rank, handling merged cells
      let rank = $(element).find("td").first().text().trim();
      if (rank === "") {
        rank = lastRank; // Use the last non-empty rank if current rank is empty
      } else {
        lastRank = rank; // Update the last non-empty rank
      }

      // Get the country name
      const countryName = $(element).find("th a").text().trim();
      const country = countryByName(countryName);

      // Check if the country exists in the predefined list
      if (!country) {
        return; // Skip this row if the country is not found
      }

      // Select all cells (td and th) in the row
      const cells = $(element).find("td, th");

      // Check if there are enough cells
      if (cells.length < 5) {
        return;
      }

      // Adjust the indices based on the actual structure
      const gold = parseInt(
        cells
          .eq(cells.length - 4)
          .text()
          .trim(),
        10,
      );
      const silver = parseInt(
        cells
          .eq(cells.length - 3)
          .text()
          .trim(),
        10,
      );
      const bronze = parseInt(
        cells
          .eq(cells.length - 2)
          .text()
          .trim(),
        10,
      );
      const total = parseInt(
        cells
          .eq(cells.length - 1)
          .text()
          .trim(),
        10,
      );

      // Check for NaN values
      if (isNaN(gold) || isNaN(silver) || isNaN(bronze) || isNaN(total)) {
        return;
      }

      medalTable.push({ country, gold, silver, bronze, total });
    });

    return medalTable;
  } catch (error) {
    console.error("Error fetching the URL:", error);
    return [];
  }
}

export default function Command() {
  const [medalTable, setMedalTable] = useState<MedalTableEntry[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadMedalTable() {
      try {
        const data = await fetchMedalTable();
        setMedalTable(data);
      } catch (error) {
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    }

    loadMedalTable();
  }, []);

  if (error) {
    showToast({ style: Toast.Style.Failure, title: "Error loading data", message: error.message });
    return <Detail markdown="" />;
  }

  return (
    <List isLoading={isLoading}>
      {medalTable.map((medals) => {
        return (
          <List.Item
            title={medals.country.name}
            icon={medals.country.flag}
            key={medals.country.name.toLowerCase()}
            accessories={[
              { text: `${medals.gold}`, icon: "🥇" },
              { text: `${medals.silver}`, icon: "🥈" },
              { text: `${medals.bronze}`, icon: "🥉" },
              { text: `${medals.total}`, icon: "🏅" },
            ]}
          />
        );
      })}
    </List>
  );
}
