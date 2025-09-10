"use client";

import { Button } from "./ui/button";

export function TestApi() {
  const handleClick = () => {
    fetch("/api/protected/test", {
      method: "POST",
      body: JSON.stringify({
        title: "Test",
        datePublished: "2021-01-01",
        rating: 5,
      }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => console.log(data));
  };

  return (
    <div>
      <Button variant="outline" onClick={handleClick}>
        Test
      </Button>
    </div>
  );
}
