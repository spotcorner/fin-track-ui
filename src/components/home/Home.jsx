"use strict";

import React from "react";
import About, { AboutHeader } from "./About.jsx";

export default function Home() {
    return <div className="container mt-3">
        <AboutHeader />
        <About linkable />
    </div>;
}
