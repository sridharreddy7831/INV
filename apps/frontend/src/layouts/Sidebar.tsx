import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, Package, Users, Truck, BarChart3, Settings, ShoppingCart, LogOut, X, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface SidebarProps {
    onLogout: () => void;
    isOpen: boolean;
    onClose: () => void;
    user?: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, isOpen, onClose, user }) => {
    const navigate = useNavigate();
    const [profile] = useLocalStorage('inv_admin_profile', {
        name: user?.name || 'Admin',
        role: user?.role || 'Admin',
        avatar: `https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=random`
    });

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'billing', icon: Receipt, label: 'Billing' },
        { id: 'inventory', icon: Package, label: 'Inventory' },
        { id: 'customers', icon: Users, label: 'Customers' },
        { id: 'vendors', icon: Truck, label: 'Vendors' },
        { id: 'analytics', icon: BarChart3, label: 'Analytics' },
        { id: 'settings', icon: Settings, label: 'Settings' },
        { id: 'admin', icon: ShieldCheck, label: 'Admin Access' },
    ];

    const filteredMenuItems = menuItems.filter(item => {
        if (!user) return true;
        if (user.role === 'Admin' || user.role === 'Super Admin') return true;
        const level = user.permissions?.[item.id] || 'none';
        return level !== 'none';
    });

    const activeStyle = "bg-[#EF4444] text-white shadow-lg";
    const inactiveStyle = "text-slate-600 hover:bg-slate-50 font-medium";

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
            )}

            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 h-full bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight cursor-pointer" onClick={() => navigate('/admin/dashboard')}>NEXA POS</h2>
                    <button onClick={onClose} className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                <nav className="flex-1 px-3 space-y-1">
                    {filteredMenuItems.map((item) => (
                        <NavLink
                            key={item.id}
                            to={`/admin/${item.id}`}
                            onClick={onClose}
                            className={({ isActive }) => `w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive ? activeStyle : inactiveStyle}`}
                        >
                            <item.icon className="w-3.5 h-3.5" />
                            <span className="text-sm font-bold">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 space-y-4">
                    {(user?.role === 'Admin' || user?.role === 'Super Admin' || (user?.permissions?.['online-store'] && user.permissions['online-store'] !== 'none')) && (
                        <NavLink
                            to="/admin/online-store"
                            onClick={onClose}
                            className={({ isActive }) => `rounded-2xl p-4 relative overflow-hidden group cursor-pointer transition-all duration-300 block ${isActive ? 'bg-[#EF4444] shadow-lg shadow-red-100' : 'bg-primary shadow-lg shadow-sky-100'}`}
                        >
                            <div className="relative z-10 flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <ShoppingCart className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="font-black text-sm text-white">Online Store</span>
                            </div>
                            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                        </NavLink>
                    )}

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center font-black text-orange-600 border border-orange-200 shrink-0 overflow-hidden">
                                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black text-slate-900 truncate">{user?.name || profile.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role || profile.role}</span>
                            </div>
                        </div>
                        <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0" title="Logout">
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
