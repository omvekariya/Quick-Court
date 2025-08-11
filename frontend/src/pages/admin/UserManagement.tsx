import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

export default function UserManagement() {
  const users = [
    { id: "u1", name: "Alex Player", role: "User", status: "Active" },
    { id: "u2", name: "Olivia Owner", role: "Owner", status: "Banned" },
  ];

  const toggleBan = (u: { id: string; status: string; name: string }) => {
    const next = u.status === "Active" ? "Banned" : "Active";
    toast({ title: "Updated", description: `${u.name} is now ${next}.` });
  };

  return (
    <main className="container mx-auto px-4 py-10 space-y-8">
      <Helmet>
        <title>User Management – QuickCourt</title>
        <meta name="description" content="Manage users and facility owners." />
        <link rel="canonical" href="/admin/users" />
      </Helmet>

      <h1 className="text-3xl font-bold">User Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.status}</TableCell>
                  <TableCell className="text-right">
                    <Button variant={u.status === "Active" ? "destructive" : "secondary"} onClick={() => toggleBan(u)}>
                      {u.status === "Active" ? "Ban" : "Unban"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
