"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import logo from "@/public/globe.svg";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/firebase/config";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatReadableDate,
  getLocalISOWithoutSeconds,
} from "@/app/function/function";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FormData {
  id: string;
  Nom: string;
  Prenom: string;
  StartDate: string;
  EndDate: string;
  NIF: string;
  Phone: string;
  Plan: string;
  DailyMoney: string;
  Balance: string;
  TotalBalance: string;
  Historic: string;
}

export default function PDFGenerator({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData | null>(null);
  const docKey = useRef("");
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState(false);
  const [errorLimit, setErrorLimit] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [openRemove, setOpenRemove] = useState(false);
  function validateAmount(value: string) {
    setAmount(value);
    setErrorLimit("");

    const numeric = Number(value);
    const current = Number(form?.Balance ?? 0);
    const total = Number(form?.TotalBalance ?? 0);

    if (numeric < 0) {
      setErrorLimit("Le montant ne peut pas être négatif.");
      return;
    }

    // Limite pour AJOUT
    if (current + numeric > total) {
      setErrorLimit("Ajouter ce montant dépasserait la limite totale.");
      return;
    }

    // Limite pour RETRAIT
    /* if (current - numeric < 0) {
      setErrorLimit("Impossible de retirer plus que la balance actuelle.");
    }*/
  }

  async function addFunds() {
    if (!form || errorLimit) return;

    setLoadingAdd(true);
    const newValue = Number(form.Balance) + Number(amount);

    try {
      const ref = doc(db, "doc", form.id);
      await updateDoc(ref, { Balance: String(newValue) });

      setForm((prev) => (prev ? { ...prev, Balance: String(newValue) } : prev));
      alert(`Vous avez ajouté: ${amount} Gdes a votre balance!`);
      setAmount("");
      setOpenAdd(false);
    } catch (err) {
      console.error("Erreur ajout fund:", err);
    } finally {
      setLoadingAdd(false);
    }
  }
  async function removeFunds() {
    if (!form || errorLimit) return;
    if (Number(form?.Balance ?? 0) - Number(amount) < 0) {
      setErrorLimit("Impossible de retirer plus que la balance actuelle.");
      alert("Impossible de retirer plus que la balance actuelle.");
    } else {
      setLoadingRemove(true);
      const newValue = Number(form.Balance) - Number(amount);

      try {
        const ref = doc(db, "doc", form.id);
        await updateDoc(ref, { Balance: String(newValue) });

        setForm((prev) =>
          prev ? { ...prev, Balance: String(newValue) } : prev
        );
        setAmount("");
        setOpenRemove(false);
        alert(`Vous avez retirer: ${amount} Gdes de votre balance!`);
      } catch (err) {
        console.error("Erreur retrait fond:", err);
      } finally {
        setLoadingRemove(false);
      }
    }
  }

  useEffect(() => {
    const fetchForm = async () => {
      docKey.current = (await params).slug;

      try {
        const docRef = doc(db, "doc", docKey.current);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setForm({
            id: docSnap.id,
            ...(docSnap.data() as Omit<FormData, "id">),
          });
        }
      } catch (error) {
        console.error("Erreur Firebase:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, []);

  if (!form) {
    return <div className="p-4 text-red-500">Données introuvables.</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center my-3">
        <button
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Génération..." : "Télécharger le PDF"}
        </button>
      </div>

      {/* Bandeau d'entête */}
      <div className="w-full bg-slate-100 py-6 px-4">
        <div className="flex flex-wrap justify-between items-center gap-6">
          <Image src={logo} alt="logo" className="w-16 h-16 object-contain" />

          <div className="flex-1 text-center">
            <p className="text-2xl font-bold mb-2">Mario Cash</p>
            <ol className="text-gray-600">
              <li>1- Le carnet est obligatoire pour toute transaction.</li>
              <li>
                2- En cas de perte du carnet un frais doit etre versé pour le
                remplacement.
              </li>
            </ol>
          </div>

          <div className="text-right text-sm text-gray-800">
            <p className="font-medium">Le :</p>
            <p>
              {formatReadableDate(getLocalISOWithoutSeconds(form.StartDate))}
            </p>
          </div>
        </div>
      </div>

      {/* Section informations */}
      <div className="bg-gray-50 p-6 mt-8 rounded-lg border">
        <h2 className="text-lg font-bold mb-4 text-blue-600">
          Informations du client
        </h2>
        <div className="bg-gray-50 p-6 mt-8 rounded-lg border">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-800">
            <p>
              <strong>Nom :</strong> {form.Nom}
            </p>
            <p>
              <strong>Prénom :</strong> {form.Prenom}
            </p>
            <p>
              <strong>Début :</strong>{" "}
              {formatReadableDate(getLocalISOWithoutSeconds(form.StartDate))}
            </p>

            <p>
              <strong>Fin :</strong>{" "}
              {formatReadableDate(getLocalISOWithoutSeconds(form.EndDate))}
            </p>
            <p>
              <strong>Plan :</strong> {form.Plan} Jours
            </p>
            <p>
              <strong>Montant quotidien :</strong> {form.DailyMoney} Gourdes
            </p>
            <p>
              <strong>NIF / CIN :</strong> {form.NIF}
            </p>

            <p>
              <strong>Téléphone :</strong> {form.Phone}
            </p>
            <p>
              <strong>Total :</strong> {form.TotalBalance} Gourdes
            </p>
            <p>
              <strong>Balance :</strong> {form.Balance} Gourdes
            </p>

            <p className="col-span-2 md:col-span-3">
              <strong>Historique :</strong> {form.Historic}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border mt-6 space-y-4">
          <p className="text-lg font-semibold">
            Balance actuelle : {form.Balance} G / {form.TotalBalance} G
          </p>

          <div>
            {/* INPUT */}
            <Input
              placeholder="Montant"
              value={amount}
              onChange={(e) => validateAmount(e.target.value)}
              type="number"
              className="w-40 my-2"
            />
            <Tabs defaultValue="100jours">
              <TabsList>
                <TabsTrigger
                  value="100jours"
                  onClick={() => {
                    validateAmount("250");
                  }}
                >
                  250G
                </TabsTrigger>
                <TabsTrigger
                  value="200jours"
                  onClick={() => {
                    validateAmount("500");
                  }}
                >
                  500G
                </TabsTrigger>
                <TabsTrigger
                  value="300jours"
                  onClick={() => {
                    validateAmount("750");
                  }}
                >
                  750G
                </TabsTrigger>
                <TabsTrigger
                  value="400jours"
                  onClick={() => {
                    validateAmount("1000");
                  }}
                >
                  1000G
                </TabsTrigger>
                <TabsTrigger
                  value="500jours"
                  onClick={() => {
                    validateAmount("1500");
                  }}
                >
                  1500G
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {errorLimit && <p className="text-red-600 text-sm">{errorLimit}</p>}

          <div className="flex items-center gap-3 mt-3">
            {/* AJOUT */}
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <Button disabled={!amount || !!errorLimit}>
                  Ajouter des fonds
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmer l'ajout</DialogTitle>
                  <DialogDescription>
                    Voulez-vous ajouter <strong>{amount}</strong> à la balance ?
                  </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                  <Button variant="secondary" onClick={() => setOpenAdd(false)}>
                    Annuler
                  </Button>

                  <Button
                    onClick={addFunds}
                    disabled={loadingAdd || !!errorLimit}
                  >
                    {loadingAdd ? "Chargement..." : "Confirmer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* RETRAIT */}
            <Dialog open={openRemove} onOpenChange={setOpenRemove}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={!amount || !!errorLimit}
                >
                  Retirer des fonds
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmer le retrait</DialogTitle>
                  <DialogDescription>
                    Voulez-vous retirer <strong>{amount}</strong> de la balance
                    ?
                  </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={() => setOpenRemove(false)}
                  >
                    Annuler
                  </Button>

                  <Button
                    onClick={removeFunds}
                    disabled={loadingRemove || !!errorLimit}
                  >
                    {loadingRemove ? "Chargement..." : "Confirmer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
