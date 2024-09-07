// Layout.js
import React from "react";
import Head from "next/head";
import Header from "./components/Header";

const Layout = ({ children }) => {
  return (
    <div className="container">
      <Head>
        <title>Paint by Numbers App</title>
        <meta
          name="description"
          content="Process images for paint by numbers"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <main className="main">
        <div className="content">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
