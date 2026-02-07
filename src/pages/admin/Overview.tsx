import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Users, DollarSign, Music, Activity } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Overview = () => {
    const { users, tracks } = useAppStore();

    // Calculate real-time stats
    const totalUsers = users.length;
    const totalTracks = tracks.length;

    // Mock Revenue Calculation (e.g. sum of purchased tracks)
    const totalRevenue = tracks.reduce((acc, track) => acc + (track.isPurchased ? track.price : 0), 0);

    // Mock Active Streams (random for demo)
    const activeStreams = Math.floor(Math.random() * 500) + 100;

    // Mock Revenue History (static for now, but could be dynamic)
    const revenueHistory = [
        { name: 'Jan', revenue: 4000 },
        { name: 'Feb', revenue: 3000 },
        { name: 'Mar', revenue: 2000 },
        { name: 'Apr', revenue: 2780 },
        { name: 'May', revenue: 1890 },
        { name: 'Jun', revenue: 2390 },
        { name: 'Jul', revenue: 3490 },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-black tracking-tighter text-white">Dashboard Overview</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-[#181818] border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-[#B3B3B3]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalUsers.toLocaleString()}</div>
                        <p className="text-xs text-[#B3B3B3]">+12% from last month</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#181818] border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-[#B3B3B3]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-[#B3B3B3]">+8.4% from last month</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#181818] border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Active Streams</CardTitle>
                        <Activity className="h-4 w-4 text-[#B3B3B3]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{activeStreams}</div>
                        <p className="text-xs text-[#B3B3B3]">+201 since last hour</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#181818] border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Total Tracks</CardTitle>
                        <Music className="h-4 w-4 text-[#B3B3B3]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalTracks}</div>
                        <p className="text-xs text-[#B3B3B3]">+43 new this week</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-[#181818] border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white">Revenue Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={revenueHistory}
                                    margin={{
                                        top: 5,
                                        right: 10,
                                        left: 10,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.5} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#B3B3B3"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#B3B3B3"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#282828', borderRadius: '8px', border: 'none', color: 'white' }}
                                        itemStyle={{ color: '#1DB954' }}
                                        cursor={{ stroke: '#1DB954', strokeWidth: 1 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#1DB954"
                                        strokeWidth={2}
                                        activeDot={{ r: 6, fill: '#1DB954', stroke: '#121212', strokeWidth: 2 }}
                                        dot={{ r: 4, fill: '#121212', stroke: '#1DB954', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Overview;
