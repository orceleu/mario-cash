"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { LogOut, PlusIcon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import Image from "next/image";
import logo from "@/public/cash.png";
import { Progress } from "@/components/ui/progress";
import {
  formatReadableDate,
  getLocalISOWithoutSeconds,
  getNumericProgress,
  useProgress,
} from "../function/function";

interface Documents {
  Nom: string;
  Prenom: string;
  EndDate: string;
  StartDate: string;
  DailyMoney: string;
  Balance: string;
  TotalBalance: string;
  Plan: string;
  Detruit: string;
}

type DocumentsWithId = Documents & { id: string };
export const PASS_DELETE = "mario4321=";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [doc1, setDoc] = useState<DocumentsWithId[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [passDelete, setPassDelete] = useState("");
  const [passDeleteOk, setPassDeleteOk] = useState(false);

  // date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exactDate, setExactDate] = useState("");
  // new filters
  const [filterDailyMoney, setFilterDailyMoney] = useState("");
  const [filterPlanDays, setFilterPlanDays] = useState("");
  const [show, setshow] = useState(false);
  const [percent, setPercent] = useState("1");
  useEffect(() => {
    setPassDeleteOk(passDelete === PASS_DELETE);
  }, [passDelete]);

  // delete popup
  const [selectedDoc, setSelectedDoc] = useState<DocumentsWithId | null>(null);
  const [openConfirmPopup, setOpenConfirmPopup] = useState(false);

  const router = useRouter();

  // FILTERS

  const filteredData = doc1.filter((data) => {
    const docDate = data.StartDate.split(" ")[0];

    const nameMatch = data.Nom.toLowerCase().includes(
      searchQuery.toLowerCase()
    );

    let exactMatch = true;
    let rangeMatch = true;

    // exact date
    if (exactDate) exactMatch = docDate === exactDate;

    // range
    if (startDate) rangeMatch = docDate >= startDate;
    if (endDate) rangeMatch = rangeMatch && docDate <= endDate;

    // NEW: carte
    const cardMatch =
      filterDailyMoney === "" ||
      Number(data.DailyMoney) === Number(filterDailyMoney);

    // NEW: nombre de jours
    const planMatch =
      filterPlanDays === "" || Number(data.Plan) === Number(filterPlanDays);

    return nameMatch && exactMatch && rangeMatch && cardMatch && planMatch;
  });

  // 🔥 TRI AUTO : documents récents en haut
  filteredData.sort((a, b) => {
    const dateA = new Date(a.StartDate);
    const dateB = new Date(b.StartDate);
    return dateB.getTime() - dateA.getTime();
  });

  // 🔥 Total global
  const totalBalanceSum = filteredData.reduce(
    (acc, item) => acc + Number(item.Balance),
    0
  );

  const totalExpectedSum = filteredData.reduce(
    (acc, item) => acc + Number(item.TotalBalance),
    0
  );

  const deleteDocument = async (collectionName: string, docId: string) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      setDoc((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
    }
  };

  const getCustomerdata = async () => {
    const querySnapshot = await getDocs(collection(db, "doc"));
    const docs: DocumentsWithId[] = querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as DocumentsWithId[];

    setDoc(docs);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.email) {
        getCustomerdata();
      } else {
        router.replace("/");
      }
    });
    return () => unsubscribe();
  }, []);

  const logOut = async () => {
    await signOut(auth);
    router.replace("/");
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-slate-100 w-full fixed top-0 border-b z-50">
        <div className="flex items-center gap-3">
          <Image src={logo} alt="logo" className="w-7 h-7" />

          <div className="hidden md:flex">
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        <p className="text-xl text-gray-700 font-bold">MARIO CASH.</p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/new-client")}
          >
            <PlusIcon className="size-4" />
            Ajouter un Client
          </Button>

          <Button variant="outline" onClick={logOut}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main */}
      <div className="pt-[75px] px-4 w-full max-w-4xl mx-auto">
        {/* Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 bg-gray-50 rounded-3xl p-3 md:p-10">
          {/* Search Bar */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">
              Recherche par nom.
            </label>
            <Input
              className="max-w-[450px]"
              placeholder="Recherche par nom"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Debut.</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Fin.</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {/* Carte (DailyMoney) */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">carte ($)</label>
            <Input
              type="number"
              placeholder="Ex : 100"
              value={filterDailyMoney}
              onChange={(e) => setFilterDailyMoney(e.target.value)}
            />
          </div>
          {/* Nombre de jours (Plan) */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">nombre de jour</label>
            <Input
              type="number"
              placeholder="Ex : 200"
              value={filterPlanDays}
              onChange={(e) => setFilterPlanDays(e.target.value)}
            />
          </div>{" "}
          {/* Reset dates */}
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setExactDate("");
              setStartDate("");
              setEndDate("");
              setSearchQuery("");
              setFilterPlanDays("");
            }}
          >
            reinitialiser
          </Button>
        </div>

        <div className=" flex justify-center my-5">
          {" "}
          <Button
            onClick={() => {
              setshow(!show);
            }}
          >
            {!show ? "Voir" : "Cacher"} les calculs
          </Button>
        </div>

        {show && (
          <div className="mb-10 p-4 border rounded-lg shadow bg-white">
            <div className="flex justify-between">
              <div>
                <p className="text-lg font-bold text-gray-700">
                  Total Global :
                </p>
                <p className="text-gray-700 text-md">
                  {totalBalanceSum}$ht / {totalExpectedSum}$ht
                </p>
              </div>
              <div>
                <p className="text-center text-sm font-bold">%</p>
                <Input
                  type="number"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  placeholder=" %"
                />
                <p className="text-center">
                  {(Number(percent) * totalExpectedSum) / 100} $ht
                </p>
              </div>
              {/* <p>
                Detruit: <span className="font-bold">0</span>
              </p>*/}
              <p className="font-bold">{filteredData.length} Clients</p>
            </div>
          </div>
        )}

        {/* Document List */}
        <ul className="space-y-4 mb-10">
          {filteredData.map((data) => (
            <li
              key={data.id}
              className={`p-4 border rounded-lg shadow-sm ${
                useProgress(data.StartDate, data.EndDate) >= 99 ||
                getNumericProgress(data.Balance, data.TotalBalance) >= 99
                  ? "bg-green-400 text-white"
                  : "bg-white"
              } hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between`}
            >
              <div
                className="cursor-pointer"
                onClick={() => router.push(`/open-doc/${data.id}`)}
              >
                <p className="font-bold text-lg">
                  {data.Nom} {data.Prenom}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <p>
                      <span className="font-bold text-gray-600">Début :</span>
                      {formatReadableDate(
                        getLocalISOWithoutSeconds(data.StartDate)
                      )}
                    </p>

                    <p className="ml-3">
                      <span className="font-bold text-gray-600">Fin :</span>
                      {formatReadableDate(
                        getLocalISOWithoutSeconds(data.EndDate)
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Progress
                      value={useProgress(data.StartDate, data.EndDate)}
                      className="flex-1"
                    />
                    <p className="text-sm font-medium">
                      {useProgress(data.StartDate, data.EndDate)}%
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 text-sm">Ajouté:</p>
                <p className="text-gray-600 text-sm">
                  {data.Balance}$ht/{data.TotalBalance}$ht
                </p>

                <div className="flex items-center gap-3">
                  <Progress
                    value={getNumericProgress(data.Balance, data.TotalBalance)}
                    className="flex-1"
                  />
                  <p className="text-sm font-medium">
                    {getNumericProgress(data.Balance, data.TotalBalance)}%
                  </p>
                </div>
              </div>

              <p>
                <span className="text-gray-700 font-bold">Carte de :</span>{" "}
                {data.DailyMoney}$ht
                <span className="text-gray-700 font-bold mx-2">Durant :</span>
                {data.Plan} Jour
              </p>

              <Button
                variant="destructive"
                className="mt-3 sm:mt-0 sm:ml-4 flex items-center gap-2"
                onClick={() => {
                  setSelectedDoc(data);
                  setOpenConfirmPopup(true);
                }}
              >
                <Trash2 className="size-4" />
                Supprimer
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {/* Confirmation Popup */}
      <Dialog open={openConfirmPopup} onOpenChange={setOpenConfirmPopup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer{" "}
              <span className="font-bold">
                {selectedDoc?.Nom} {selectedDoc?.Prenom}
              </span>
              ? <br />
              Cette action est irréversible. Entrer votre mot de passe pour
              confirmer!
              <Input
                type="password"
                value={passDelete}
                onChange={(e) => setPassDelete(e.target.value)}
                className="my-3"
              />
              {passDeleteOk ? (
                <span className="text-green-500">Suppression autorisé</span>
              ) : (
                <span className="text-red-500">
                  Suppression non authorisé aux intrus! (li tap trò facile)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenConfirmPopup(false);
                setPassDeleteOk(false);
                setPassDelete("");
              }}
            >
              Non, Fermer
            </Button>

            <Button
              variant="destructive"
              disabled={!passDeleteOk}
              onClick={() => {
                if (selectedDoc) deleteDocument("doc", selectedDoc.id);
                setOpenConfirmPopup(false);
                setPassDeleteOk(false);
                setPassDelete("");
              }}
            >
              Oui, Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
