"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import logo from "@/public/cash.png";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/app/firebase/config";

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
  generateData,
  getLocalISOWithoutSeconds,
} from "@/app/function/function";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LockerTable from "@/app/clientComponent/table";
import { PASS_DELETE } from "@/app/dashboard/page";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoaderIcon } from "lucide-react";
import { onAuthStateChanged, User } from "firebase/auth";

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
  const [test, setest] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState(false);
  const [errorLimit, setErrorLimit] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [openRemove, setOpenRemove] = useState(false);
  const [passDelete, setPassDelete] = useState("");
  const [passDeleteOk, setPassDeleteOk] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const stringRef = useRef<string>(""); // initialisé vide
  useEffect(() => {
    if (passDelete === PASS_DELETE) {
      setPassDeleteOk(true);
    } else {
      setPassDeleteOk(false);
    }
  }, [passDelete]);
  const appendString = (initial: string, add: string) => {
    if (!stringRef.current) {
      stringRef.current = initial; // si vide, initialise avec initial
    }
    stringRef.current += add; // ajoute la nouvelle valeur
    return stringRef.current;
  };

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
    setPassDeleteOk(false);
    setPassDelete("");
    setLoadingAdd(true);
    const newValue = Number(form.Balance) + Number(amount);

    try {
      const ref = doc(db, "doc", form.id);
      //actualise les deux propriete dans la base : historic et balance
      await updateDoc(ref, {
        Balance: String(newValue),
        Historic: appendString(
          form.Historic,
          generateData(Number(amount), Number(form.DailyMoney), "dep")
        ),
      });

      setForm((prev) =>
        prev
          ? {
              ...prev,
              Balance: String(newValue),
            }
          : prev
      );
      alert(`Vous avez ajouté: ${amount} $ a votre balance!`);
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
    setPassDeleteOk(false);
    setPassDelete("");
    if (Number(form?.Balance ?? 0) - Number(amount) < 0) {
      setErrorLimit("Impossible de retirer plus que la balance actuelle.");
      alert("Impossible de retirer plus que la balance actuelle.");
    } else {
      setLoadingRemove(true);
      const newValue = Number(form.Balance) - Number(amount);

      try {
        const ref = doc(db, "doc", form.id);
        await updateDoc(ref, {
          Balance: String(newValue),
          Historic: appendString(
            form.Historic,
            generateData(Number(amount), Number(form.DailyMoney), "retr")
          ),
        });

        setForm((prev) =>
          prev ? { ...prev, Balance: String(newValue) } : prev
        );
        setAmount("");
        setOpenRemove(false);
        alert(`Vous avez retirer: ${amount} $ de votre balance!`);
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
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  if (!form) {
    return (
      <div className="p-4 flex justify-center mt-40">
        <LoaderIcon className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Bandeau d'entête */}
      <div className="w-full bg-slate-100 py-6 px-4">
        <div className="flex flex-wrap justify-between items-center gap-6">
          <Image src={logo} alt="logo" className="w-16 h-16 object-contain" />

          <div className="flex-1 text-center">
            <p className="text-xl md:text-2xl font-bold mb-2">Mario Cash</p>
            <ol className="text-[10px] md:text-[15px] text-gray-600">
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
        <h2 className="text-lg font-bold mb-4 text-gray-700 text-center">
          Informations client & compte
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
            <p className="text-green-600">
              <strong>Montant quotidien :</strong> {form.DailyMoney} $ht
            </p>
            <p>
              <strong>NIF / CIN :</strong> {form.NIF}
            </p>

            <p>
              <strong>Téléphone :</strong> {form.Phone}
            </p>
            <p>
              <strong>Total :</strong> {form.TotalBalance} $ht
            </p>
            <p>
              <strong>Balance :</strong> {form.Balance} $ht
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border  mt-6 space-y-4">
          <p className="text-lg font-semibold text-center">
            Balance actuelle : {form.Balance} $ht / {form.TotalBalance} $ht
          </p>
          <div className="flex justify-center">
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
                      validateAmount("50");
                    }}
                  >
                    50 $ht
                  </TabsTrigger>
                  <TabsTrigger
                    value="200jours"
                    onClick={() => {
                      validateAmount("100");
                    }}
                  >
                    100 $ht
                  </TabsTrigger>
                  <TabsTrigger
                    value="300jours"
                    onClick={() => {
                      validateAmount("150");
                    }}
                  >
                    150 $ht
                  </TabsTrigger>
                  <TabsTrigger
                    value="400jours"
                    onClick={() => {
                      validateAmount("200");
                    }}
                  >
                    200 $ht
                  </TabsTrigger>
                  <TabsTrigger
                    value="500jours"
                    onClick={() => {
                      validateAmount("300");
                    }}
                  >
                    300 $ht
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {errorLimit && (
            <p className="text-red-600 text-sm text-center">{errorLimit}</p>
          )}
          <div className="flex justify-center">
            <div className="flex items-center gap-3 mt-3">
              {/* AJOUT */}
              <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-green-600 hover:bg-green-500"
                    disabled={!amount || !!errorLimit}
                  >
                    Ajouter des fonds
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmer l'ajout</DialogTitle>
                    <DialogDescription>
                      Voulez-vous ajouter <strong>{amount}$ht</strong> à la
                      balance ? Entrer votre mot de passe!
                      <Input
                        type="password"
                        value={passDelete}
                        onChange={(e) => {
                          setPassDelete(e.target.value);
                        }}
                        className="my-3"
                      />
                      {passDeleteOk ? (
                        <span className="text-green-500">autorisé</span>
                      ) : (
                        <span className="text-red-500">non authorisé</span>
                      )}
                    </DialogDescription>
                  </DialogHeader>

                  <DialogFooter>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setOpenAdd(false);
                        setPassDeleteOk(false);
                        setPassDelete("");
                      }}
                    >
                      Annuler
                    </Button>

                    <Button
                      onClick={addFunds}
                      disabled={loadingAdd || !!errorLimit || !passDeleteOk}
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
                      Voulez-vous retirer <strong>{amount}$ht</strong> de la
                      balance ?
                      <Input
                        type="password"
                        value={passDelete}
                        onChange={(e) => {
                          setPassDelete(e.target.value);
                        }}
                        className="my-3"
                      />
                      {passDeleteOk ? (
                        <span className="text-green-500">autorisé</span>
                      ) : (
                        <span className="text-red-500">non authorisé</span>
                      )}
                    </DialogDescription>
                  </DialogHeader>

                  <DialogFooter>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setOpenRemove(false);
                        setPassDeleteOk(false);
                        setPassDelete("");
                      }}
                    >
                      Annuler
                    </Button>

                    <Button
                      onClick={removeFunds}
                      disabled={loadingRemove || !!errorLimit || !passDeleteOk}
                    >
                      {loadingRemove ? "Chargement..." : "Confirmer"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        <p className="my-5 md:text-xl font-bold text-center text-gray-700 underline">
          transactions
        </p>
        <p className="text-gray-700 text-center my-4">
          NB: 1-Les retraits ne sont pas prise en compte pour les jours payés.
          (pa gen fè back). 2- Veuillez actualiser la page pour afficher les
          donnees recentes.
        </p>
        <div className="h-1 bg-gray-700"></div>
        <ScrollArea className="w-full h-[600px]">
          <div className="my-10 w-full">
            <LockerTable plan={Number(form.Plan)} data={form.Historic} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
