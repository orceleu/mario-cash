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
import {
  CheckCheck,
  CheckCircle,
  LogOut,
  PlusIcon,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import Image from "next/image";
import logo from "@/public/globe.svg";
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
}

type DocumentsWithId = Documents & { id: string };

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [doc1, setDoc] = useState<DocumentsWithId[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exactDate, setExactDate] = useState("");

  // delete popup
  const [selectedDoc, setSelectedDoc] = useState<DocumentsWithId | null>(null);
  const [openConfirmPopup, setOpenConfirmPopup] = useState(false);

  const router = useRouter();
  const filteredData = doc1.filter((data) => {
    const nameMatch = data.Nom.toLowerCase().includes(
      searchQuery.toLowerCase()
    );

    // extract YYYY-MM-DD part
    const docDate = data.StartDate.split(" ")[0];

    let exactMatch = true;
    let rangeMatch = true;

    if (exactDate) {
      exactMatch = docDate === exactDate;
    }

    if (startDate) {
      rangeMatch = docDate >= startDate;
    }
    if (endDate) {
      rangeMatch = rangeMatch && docDate <= endDate;
    }

    return nameMatch && exactMatch && rangeMatch;
  });

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
      <div className="flex justify-between items-center p-4  bg-slate-100 w-full fixed top-0 border-b z-50">
        <Image src={logo} alt="logo" className="w-7 h-7" />

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
      <div className="pt-32 px-4 w-full max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="flex justify-center mb-10">
          <Input
            className="max-w-[450px]"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* Start Date */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">From</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">To</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Reset dates */}
        <Button
          variant="outline"
          className="mb-10"
          onClick={() => {
            setExactDate("");
            setStartDate("");
            setEndDate("");
          }}
        >
          Reset filters
        </Button>

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
                <div className=" space-y-2">
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
                  {data.Balance}Gds/{data.TotalBalance}Gds
                </p>

                <div className="flex items-center gap-3 ">
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
                <span className="text-gray-700 font-bold ">Carte de :</span>{" "}
                {data.DailyMoney}G
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
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenConfirmPopup(false)}
            >
              Non, Fermer
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                if (selectedDoc) {
                  deleteDocument("doc", selectedDoc.id);
                }
                setOpenConfirmPopup(false);
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
