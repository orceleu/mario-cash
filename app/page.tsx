"use client";
import React from "react";
import { useState, useEffect } from "react";
import { auth } from "./firebase/config";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderIcon } from "lucide-react";
import logo from "@/public//globe.svg";

import Image from "next/image";
export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const navigate = useRouter();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log(` urerr: ${user}`);
      if (user != null) {
        router.replace("/dashboard");
        console.log(currentUser?.email);
      }
    });
    return () => unsubscribe();
  }, [user]);

  /*const handleSignUp = async (e: any) => {
    e.preventDefault();
    console.log({ email, password });

    if (password == repassword) {
      setIsLoginLoading(true);
      try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        console.log({ res });
        setEmail("");
        setPassword("");
        // createCustomerId(email);

        router.replace("/dashboard");
      } catch (error) {
        console.log("your password length must be up 6 ");
        console.error(error);
        setIsLoginLoading(false);
      }
    } else {
      console.log("password must be identique!");
      //
    }
  };*/
  const HandleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoginLoading(true);
    try {
      const userCresidential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log(userCresidential.user);

      navigate.push("/dashboard");
    } catch (error) {
      console.log(error);
      setIsLoginLoading(false);

      alert(`${error}`);
    }
  };
  return (
    <div className=" bg-gray-100">
      {" "}
      <br />
      <div className="border h-[100px] mx-10 md:mx-[100px]">
        <div className=" flex justify-center my-auto p-10 ">
          {" "}
          <Image src={logo} alt="logo" className="size-[100px]" />
        </div>
      </div>
      <div className="flex items-center justify-center min-h-screen  p-5">
        <div className="w-full max-w-md p-6 space-y-4 bg-white shadow-md rounded-lg">
          <div defaultValue="login" className="w-full">
            <h2 className="text-2xl font-bold text-center">Login</h2>

            <form className=" space-y-4" onSubmit={HandleSubmit}>
              <div className="p-2">
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div className="p-2">
                <label className="block text-sm font-medium mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-4 bg-gray-600 hover:bg-gray-500"
              >
                {isLoginLoading ? (
                  <>
                    <LoaderIcon className="animate-spin" />
                  </>
                ) : (
                  <p>Login</p>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
