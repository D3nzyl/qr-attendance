import {
  createNextDevMiddleware
} from "@allocatespace/as2-platform-sdk";
import { NextResponse } from "next/server";

export default createNextDevMiddleware(NextResponse);
