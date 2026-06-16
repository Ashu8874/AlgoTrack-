"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type CompareFormProps = {
  defaultUsers: string;
};

export function CompareForm({ defaultUsers }: CompareFormProps) {
  const [value, setValue] = useState(defaultUsers);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compare users</CardTitle>
        <CardDescription>Enter multiple LeetCode usernames separated by commas.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-3 sm:flex-row" method="get">
          <Input
            className="flex-1"
            name="users"
            placeholder="alice,bob,charlie"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <Button type="submit">Compare</Button>
        </form>
      </CardContent>
    </Card>
  );
}
