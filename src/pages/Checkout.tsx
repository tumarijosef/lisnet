import { useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { ChevronLeft, CreditCard, ShieldCheck, Lock } from "lucide-react";
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../lib/translations';

const Checkout = () => {
    const navigate = useNavigate();
    const { language } = useLanguageStore();
    const t = translations[language].release;

    return (
        <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6 text-white text-center">
            {/* Back Button */}
            <div className="absolute top-12 left-6">
                <Button
                    variant="ghost"
                    className="text-white/50 hover:text-white pl-0 hover:bg-transparent uppercase font-black text-xs tracking-widest flex items-center gap-1"
                    onClick={() => navigate(-1)}
                >
                    <ChevronLeft size={18} /> {t.back}
                </Button>
            </div>

            <div className="max-w-md w-full space-y-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-[#1DB954]/10 flex items-center justify-center text-[#1DB954]">
                        <CreditCard size={40} />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Payment</h1>
                    <p className="text-[#B3B3B3] font-medium text-sm">
                        This is a placeholder for the payment integration. You will be able to complete your purchase here in the future.
                    </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                    <div className="flex items-center gap-3 text-left">
                        <div className="p-2 rounded-lg bg-white/5 text-[#1DB954]">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-tight">Secure Payment</h4>
                            <p className="text-[10px] text-[#B3B3B3] font-mono">Advanced encryption protected</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-left">
                        <div className="p-2 rounded-lg bg-white/5 text-[#1DB954]">
                            <Lock size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-tight">Privacy Guaranteed</h4>
                            <p className="text-[10px] text-[#B3B3B3] font-mono">Your data is never shared</p>
                        </div>
                    </div>
                </div>

                <div className="pt-8 space-y-4">
                    <Button
                        className="w-full h-14 bg-[#1DB954] text-black hover:bg-[#1ed760] font-black uppercase tracking-widest text-sm rounded-full shadow-xl shadow-[#1DB954]/20"
                        onClick={() => alert('Payment logic coming soon!')}
                    >
                        Confirm Payment (Coming Soon)
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full h-12 text-[#B3B3B3] hover:text-white font-bold uppercase tracking-widest text-[10px]"
                        onClick={() => navigate(-1)}
                    >
                        Go Back
                    </Button>
                </div>
            </div>

            <div className="absolute bottom-12 text-[#B3B3B3] flex items-center gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Lisnet Secure Checkout</span>
            </div>
        </div>
    );
};

export default Checkout;
