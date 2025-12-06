"use client";

import React, { useMemo } from "react";
import {
  formatReadableDate,
  getLocalISOWithoutSeconds,
} from "../function/function";

type Props = {
  plan: number; // nombre total de casiers
  data: string; // "date,montant,jours,action;..."
};

export default function LockerTable({ plan, data }: Props) {
  // Transforme STRING → MAP
  const parsed = useMemo(() => {
    if (!data || data.trim() === "") return {};

    const entries = data.split(";").map((item) => item.trim());

    const map: Record<
      number,
      { date: string; amount: number; days: number; action: string }
    > = {};

    entries.forEach((item, index) => {
      const [date, amount, days, action] = item.split(",");
      if (date && amount && days && action) {
        map[index + 1] = {
          date,
          amount: Number(amount),
          days: Number(days),
          action,
        };
      }
    });

    return map;
  }, [data]);

  // Total des jours payés
  const totalDays = useMemo(() => {
    return Object.values(parsed).reduce(
      (acc, row) => acc + (row.action == "dep" ? row.days : 0),
      0
    );
  }, [parsed]);

  const totalColor =
    totalDays < 10
      ? "text-red-600"
      : totalDays < 20
      ? "text-yellow-600"
      : "text-green-600";

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border border-gray-300 rounded-md">
        <thead className="bg-gray-100 text-[10px] md:text-sm">
          <tr>
            <th className="p-2 border">Jours payés</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Montant</th>
            <th className="p-2 border">Jours crédités/déduits</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: plan }, (_, i) => {
            const id = i + 1;
            const row = parsed[id];

            // Bleu si paid (# dépend du nombre de jours)
            const isPaid = id <= totalDays;
            const paidColor = isPaid
              ? "bg-green-600 text-white"
              : "bg-gray-300 text-black";

            // Action color: retrait rouge / dépôt vert
            const actionColor = row
              ? row.action === "dep"
                ? "text-green-600"
                : "text-red-600"
              : "text-black";

            return (
              <tr key={id} className="text-center text-[10px] md:text-sm">
                <td className={`p-2 border font-semibold ${paidColor}`}>
                  {id}
                </td>

                <td className="p-2 border">
                  {row
                    ? formatReadableDate(getLocalISOWithoutSeconds(row.date))
                    : "-"}
                </td>

                <td className="p-2 border">{row ? row.amount + " $" : "-"}</td>

                <td className="p-2 border">{row ? row.days : "-"}</td>

                <td className={`p-2 border font-bold ${actionColor}`}>
                  {row ? (row.action === "dep" ? "Dépôt" : "Retrait") : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 font-semibold">
        Total des jours payés :{" "}
        <span className={totalColor}>
          {totalDays}/{plan}
        </span>
      </div>
    </div>
  );
}
