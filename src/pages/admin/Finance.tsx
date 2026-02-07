
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ADMIN_TRANSACTIONS } from "./adminData";
import { ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react";

const Finance = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black tracking-tighter">Finance</h2>
                <Button className="gap-2">
                    <Wallet size={16} />
                    Manage Wallet
                </Button>
            </div>

            <div className="rounded-md border bg-tg-bg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Transaction ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>User / Artist</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ADMIN_TRANSACTIONS.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell className="font-mono text-xs text-tg-hint">{tx.id}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {tx.type === 'purchase' ? (
                                            <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                                                <ArrowDownLeft size={16} />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center">
                                                <ArrowUpRight size={16} />
                                            </div>
                                        )}
                                        <span className="capitalize font-medium">{tx.type}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-bold">{tx.user}</TableCell>
                                <TableCell className={tx.type === 'purchase' ? 'text-green-500 font-mono' : 'text-orange-500 font-mono'}>
                                    {tx.type === 'purchase' ? '+' : '-'}{tx.amount} TON
                                </TableCell>
                                <TableCell className="text-tg-hint">{tx.date}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={tx.status === 'completed' ? 'secondary' : 'outline'}>
                                        {tx.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default Finance;
