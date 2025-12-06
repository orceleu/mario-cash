"use client";
import { db } from "@/app/firebase/config";
import { addDaysToNow, generateData } from "@/app/function/function";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export const PLAN1 = 100;
export const PLAN2 = 200;
export const PLAN3 = 300;

export default function page() {
  const [disableEnd, setDisableEnd] = useState(true);
  const [money, setMoney] = useState(0);
  const router = useRouter();
  const [form, setForm] = useState({
    Nom: "",
    Prenom: "",
    StartDate: new Date().toISOString(),
    EndDate: "",
    NIF: "",
    Phone: "",
    Plan: PLAN1,
    DailyMoney: "",
    Balance: "",
    TotalBalance: "",
    Historic: "",
  });

  const handleChange = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const calculateMoney = (daily: number, days: number) => daily * days;

  // Initialisation EndDate pour plan 100 jours
  useEffect(() => {
    handleChange("EndDate", addDaysToNow(form.Plan.toString()));
  }, []);

  // Calcul automatique dès que DailyMoney ou Plan change
  useEffect(() => {
    const daily = Number(form.DailyMoney) || 0;
    handleChange("TotalBalance", calculateMoney(daily, form.Plan).toString());
    setMoney(calculateMoney(daily, form.Plan));
  }, [form.DailyMoney, form.Plan]);

  // Calcul automatique quand la date personnalisée change
  const handleEndDateChange = (value: string) => {
    handleChange("EndDate", value);

    const start = new Date(form.StartDate);
    const end = new Date(value);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daily = Number(form.DailyMoney) || 0;
    handleChange("TotalBalance", calculateMoney(daily, diffDays).toString());
    setMoney(calculateMoney(daily, diffDays));
    handleChange("Plan", diffDays);
  };

  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, "doc"), form);
      alert("Document ajouté avec succès");

      setForm({
        Nom: "",
        Prenom: "",
        StartDate: new Date().toISOString(),
        EndDate: "",
        NIF: "",
        Phone: "",
        Plan: PLAN1,
        DailyMoney: "",
        Balance: "",
        TotalBalance: "",
        Historic: "",
      });
      setMoney(0);
      setDisableEnd(true);
      router.push("/dashboard");
    } catch (error) {
      console.error("Erreur Firestore:", error);
      alert("Erreur lors de l’ajout");
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-2xl">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Ajouter un client
        </h1>

        <h2 className="text-xl underline text-gray-700 font-bold text-center my-5">
          Durant
        </h2>

        <div className="flex justify-center mx-auto my-5 items-center">
          <Tabs defaultValue="100jours">
            <TabsList>
              <TabsTrigger
                value="100jours"
                onClick={() => {
                  handleChange("EndDate", addDaysToNow(PLAN1.toString()));
                  handleChange("Plan", PLAN1);
                }}
              >
                100 jours
              </TabsTrigger>
              <TabsTrigger
                value="200jours"
                onClick={() => {
                  handleChange("EndDate", addDaysToNow(PLAN2.toString()));
                  handleChange("Plan", PLAN2);
                }}
              >
                200 jours
              </TabsTrigger>
              <TabsTrigger
                value="300jours"
                onClick={() => {
                  handleChange("EndDate", addDaysToNow(PLAN3.toString()));
                  handleChange("Plan", PLAN3);
                }}
              >
                300 jours
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-gray-700 font-bold mx-3">= {money} $ht</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="grid gap-10">
            <div className="grid grid-cols-2 gap-4">
              {/* DailyMoney */}
              <div className="grid gap-2">
                <p>Carte de:</p>
                <Input
                  type="number"
                  value={form.DailyMoney}
                  onChange={(e) => {
                    handleChange("DailyMoney", e.target.value);
                    //handleChange("Balance", e.target.value);
                  }}
                  placeholder="Montant ($ht)"
                  required
                />
              </div>
              {/* DailyMoney */}
              <div className="grid gap-2">
                <p>Ajouté :</p>
                <Input
                  type="number"
                  value={form.Balance}
                  onChange={(e) => {
                    handleChange("Balance", e.target.value);
                    handleChange(
                      "Historic",
                      generateData(
                        Number(e.target.value),
                        Number(form.DailyMoney),
                        "dep"
                      )
                    );
                  }}
                  placeholder="Montant initial ($ht)"
                  required
                />
              </div>

              {/* Nom */}
              <div className="grid gap-2">
                <p>Nom.</p>
                <Input
                  value={form.Nom}
                  onChange={(e) => handleChange("Nom", e.target.value)}
                  placeholder="Nom"
                  required
                />
              </div>

              {/* Prenom */}
              <div className="grid gap-2">
                <p>Prénom.</p>
                <Input
                  value={form.Prenom}
                  onChange={(e) => handleChange("Prenom", e.target.value)}
                  placeholder="Prenom"
                  required
                />
              </div>

              {/* NIF */}
              <div className="grid gap-2">
                <p>NIF/CIN.</p>
                <Input
                  value={form.NIF}
                  onChange={(e) => handleChange("NIF", e.target.value)}
                  placeholder="NIF/CIN"
                  required
                />
              </div>

              {/* Phone */}
              <div className="grid gap-2">
                <p>Téléphone.</p>
                <Input
                  value={form.Phone}
                  onChange={(e) => handleChange("Phone", e.target.value)}
                  placeholder="+509"
                  type="number"
                />
              </div>

              {/* End Date */}
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <p>Fin.</p>
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!disableEnd}
                      onChange={(e) => setDisableEnd(!e.target.checked)}
                    />
                    personnalisée?
                  </div>
                </div>

                <Input
                  value={form.EndDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  placeholder="2025-04-18 10:30"
                  type="datetime-local"
                  disabled={disableEnd}
                  required={!disableEnd}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button type="submit" className="px-6 py-2">
              Ajouter
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
