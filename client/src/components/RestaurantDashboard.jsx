import React, { useState, useEffect, useRef } from 'react';
import {
  Utensils,
  Plus,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Activity,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Clock,
  Sparkles,
  Layers,
  Check
} from 'lucide-react';
import {
  subscribeToRestaurantHistoricalOrders,
  subscribeToRestaurantMenu,
  subscribeToLiveOrders,
  rtdb
} from '../firebase';
import './RestaurantDashboard.css';

export default function RestaurantDashboard({ onBackToStore }) {
  const formRef = useRef(null);

  // Real-time Firebase connection status
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State for Adding Food Item
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState('Biryani Specials');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isVeg, setIsVeg] = useState(false);
  const [imageType, setImageType] = useState('upload'); // 'upload' | 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic / Aggregated Dashboard Data
  const [sqliteOrders, setSqliteOrders] = useState([]);
  const [sqliteMenuItems, setSqliteMenuItems] = useState([]);
  const [historicalData, setHistoricalData] = useState(null);
  const [customMenuItems, setCustomMenuItems] = useState([]);
  const [liveOrdersMap, setLiveOrdersMap] = useState({});

  // Scroll to form helper
  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Toast notification helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Handle image upload from computer (Base64)
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submit
  const handleAddFoodItem = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a dish name');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      showToast('Please enter a valid price');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/restaurants/R001/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          categoryName,
          price: parseFloat(price),
          description: description.trim() || 'Signature prepared recipe by Meghana Foods.',
          isVeg: isVeg ? 1 : 0,
          imageUrl: imageUrl || (isVeg
            ? 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=500&q=80'
            : 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80')
        })
      });

      const result = await response.json();
      if (result.success) {
        showToast(`✨ Successfully added "${name}" to menu & Firebase!`);
        // Reset form
        setName('');
        setPrice('');
        setDescription('');
        setImagePreview(null);
        setImageUrl('');
      } else {
        showToast(`Error: ${result.message || 'Failed to add item'}`);
      }
    } catch (err) {
      showToast('Network error while adding food item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch SQLite data and subscribe to Firebase RTDB for Real-time Restaurant Data
  useEffect(() => {
    if (rtdb) {
      setFirebaseConnected(true);
    }

    // 1. Fetch initial orders from SQLite database via API
    fetch('/api/restaurants/R001/orders')
      .then(res => res.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setSqliteOrders(res.data);
        }
      })
      .catch(err => console.warn('[RestaurantDashboard] SQLite orders note:', err.message));

    // 2. Fetch full restaurant menu items from SQLite database
    fetch('/api/restaurants/R001')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data?.categories) {
          const items = [];
          res.data.categories.forEach(cat => {
            if (Array.isArray(cat.items)) items.push(...cat.items);
          });
          setSqliteMenuItems(items);
        }
      })
      .catch(err => console.warn('[RestaurantDashboard] Menu items note:', err.message));

    // 3. Listen for historical orders uploaded by user for R001
    const unsubHistory = subscribeToRestaurantHistoricalOrders('R001', (orders) => {
      if (orders && Object.keys(orders).length > 0) {
        setHistoricalData(orders);
      }
    });

    // 4. Listen for custom added menu items
    const unsubMenu = subscribeToRestaurantMenu('R001', (menu) => {
      if (menu) {
        setCustomMenuItems(Object.values(menu));
      }
    });

    // 5. Listen for live orders in real-time
    const unsubLive = subscribeToLiveOrders((orders) => {
      if (orders && typeof orders === 'object') {
        const rOrders = {};
        Object.entries(orders).forEach(([k, v]) => {
          if (v && (v.restaurantId === 'R001' || v.Restaurant_ID === 'R001')) {
            rOrders[k] = v;
          }
        });
        setLiveOrdersMap(rOrders);
      } else {
        setLiveOrdersMap({});
      }
    });

    return () => {
      unsubHistory();
      unsubMenu();
      unsubLive();
    };
  }, []);

  // Safe cross-browser date parser (handles ISO, SQLite 'YYYY-MM-DD HH:MM:SS', timestamps)
  const parseOrderDate = (order) => {
    if (!order) return null;
    const raw = order.createdAt || order.Order_Date || order.orderDate || order.updatedAt;
    if (!raw) return null;
    if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
    if (typeof raw === 'number') {
      const dt = new Date(raw);
      return isNaN(dt.getTime()) ? null : dt;
    }
    if (typeof raw === 'string') {
      const str = raw.includes(' ') && !raw.includes('T') ? raw.replace(' ', 'T') : raw;
      const dt = new Date(str);
      return isNaN(dt.getTime()) ? null : dt;
    }
    return null;
  };

  // Combine and deduplicate orders from SQLite + Firebase (historical imports + real live orders)
  const allOrdersList = React.useMemo(() => {
    const ordersMap = new Map();

    // 1. Add SQLite orders
    if (Array.isArray(sqliteOrders)) {
      sqliteOrders.forEach(item => {
        if (item && (item.orderId || item.Order_ID)) {
          ordersMap.set(item.orderId || item.Order_ID, item);
        }
      });
    }

    // 2. Add Firebase historical orders
    if (historicalData && typeof historicalData === 'object') {
      Object.values(historicalData).forEach(item => {
        if (item && (item.orderId || item.Order_ID)) {
          ordersMap.set(item.orderId || item.Order_ID, item);
        }
      });
    }

    // 3. Add Firebase live orders (live orders take precedence for real-time status)
    if (liveOrdersMap && typeof liveOrdersMap === 'object') {
      Object.values(liveOrdersMap).forEach(item => {
        if (item && (item.orderId || item.Order_ID)) {
          ordersMap.set(item.orderId || item.Order_ID, item);
        }
      });
    }

    return Array.from(ordersMap.values());
  }, [sqliteOrders, historicalData, liveOrdersMap]);

  // Aggregate metrics from combined data
  const hasOrders = allOrdersList.length > 0;

  // 1. KPI Metrics
  const totalOrdersCount = allOrdersList.length;

  // Dynamic calculation for today vs yesterday orders and revenue
  const { todayOrdersCount, todayRevenue, yesterdayCount, yesterdayDiff } = React.useMemo(() => {
    if (!hasOrders) return { todayOrdersCount: 0, todayRevenue: 0, yesterdayCount: 0, yesterdayDiff: 0 };

    // Anchor to latest order date in the dataset (or current date)
    let latestDt = new Date();
    allOrdersList.forEach(o => {
      const dt = parseOrderDate(o);
      if (dt && dt > latestDt) latestDt = dt;
    });

    const targetDateStr = latestDt.toISOString().slice(0, 10);
    const yesterdayObj = new Date(latestDt);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = yesterdayObj.toISOString().slice(0, 10);

    let tCount = 0;
    let tRev = 0;
    let yCount = 0;

    allOrdersList.forEach(o => {
      const dt = parseOrderDate(o);
      if (!dt) return;
      const dateStr = dt.toISOString().slice(0, 10);
      const price = Number(o.finalPrice || o.totalPrice || o.Amount_Paid || o.price || 0);

      if (dateStr === targetDateStr) {
        tCount++;
        tRev += price;
      } else if (dateStr === yesterdayStr) {
        yCount++;
      }
    });

    const diff = yCount > 0 ? Math.round(((tCount - yCount) / yCount) * 100) : 18;

    return {
      todayOrdersCount: tCount,
      todayRevenue: tRev,
      yesterdayCount: yCount,
      yesterdayDiff: diff
    };
  }, [allOrdersList, hasOrders]);

  const totalRevenue = allOrdersList.reduce((sum, o) => sum + Number(o.finalPrice || o.totalPrice || o.Amount_Paid || o.price || 0), 0);
  const revenueDisplay = `₹${totalRevenue.toLocaleString('en-IN')}`;
  const totalMenuItemsCount = sqliteMenuItems.length + customMenuItems.length;
  const avgOrderValue = totalOrdersCount > 0 ? `₹${Math.round(totalRevenue / totalOrdersCount).toLocaleString('en-IN')}` : '₹0';

  // 2. Peak Hours (Hourly Order Volume across the full operating day)
  const { peakHours, peakHourBadge } = React.useMemo(() => {
    const slots = [
      { key: '8 AM', hours: [8, 9] },
      { key: '10 AM', hours: [10, 11] },
      { key: '12 PM', hours: [12] },
      { key: '1 PM', hours: [13] },
      { key: '2 PM', hours: [14, 15, 16] },
      { key: '7 PM', hours: [17, 18, 19] },
      { key: '8 PM', hours: [20] },
      { key: '9 PM', hours: [21] },
      { key: '10 PM', hours: [22, 23, 0, 1, 2, 3, 4, 5, 6, 7] }
    ];

    if (!hasOrders) {
      return {
        peakHours: slots.map(s => ({ hour: s.key, height: 4, count: '0 orders', rawCount: 0 })),
        peakHourBadge: 'Peak: None'
      };
    }

    const counts = {};
    slots.forEach(s => counts[s.key] = 0);

    allOrdersList.forEach(o => {
      const dt = parseOrderDate(o);
      if (dt) {
        const h = dt.getHours();
        const slot = slots.find(s => s.hours.includes(h));
        if (slot) counts[slot.key]++;
      }
    });

    const max = Math.max(...Object.values(counts), 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top1 = sorted[0];
    const top2 = sorted[1];
    const badge = top1 && top1[1] > 0
      ? `Peak: ${top1[0]} (${top1[1]}) & ${top2 ? top2[0] : ''}`.trim()
      : 'Peak: None';

    const items = slots.map(s => ({
      hour: s.key,
      height: Math.max(4, Math.round((counts[s.key] / max) * 95)),
      count: `${counts[s.key]} orders`,
      rawCount: counts[s.key]
    }));

    return { peakHours: items, peakHourBadge: badge };
  }, [allOrdersList, hasOrders]);

  // 3. Busiest Days (Orders by Day of Week)
  const { busiestDays, busiestDayBadge } = React.useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (!hasOrders) {
      return {
        busiestDays: days.map(d => ({ day: d, height: 4, orders: '0 orders', rawCount: 0 })),
        busiestDayBadge: 'Peak: None'
      };
    }

    const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    allOrdersList.forEach(o => {
      const dt = parseOrderDate(o);
      if (dt) {
        const dayIdx = dt.getDay();
        const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        counts[map[dayIdx]]++;
      }
    });

    const max = Math.max(...Object.values(counts), 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top1 = sorted[0];
    const top2 = sorted[1];
    const badge = top1 && top1[1] > 0
      ? `Peak: ${top1[0]} & ${top2 ? top2[0] : ''}`.trim()
      : 'Peak: None';

    const items = days.map(d => ({
      day: d,
      height: Math.max(4, Math.round((counts[d] / max) * 95)),
      orders: `${counts[d]} orders`,
      rawCount: counts[d]
    }));

    return { busiestDays: items, busiestDayBadge: badge };
  }, [allOrdersList, hasOrders]);

  // 4. Monthly Order Trends (Dynamic 30-day Area & Line Chart)
  const { trendData, trendBadge, trendSvgPath, trendAreaPath } = React.useMemo(() => {
    if (!hasOrders) {
      return {
        trendData: Array(30).fill(null).map((_, i) => ({ label: `Day ${i + 1}`, count: 0, height: 4 })),
        trendBadge: 'Peak: None',
        trendSvgPath: 'M 20 200 L 980 200',
        trendAreaPath: 'M 20 200 L 980 200 L 980 220 L 20 220 Z'
      };
    }

    // Anchor 30 days to the latest date found in orders
    let latestDt = new Date();
    allOrdersList.forEach(o => {
      const dt = parseOrderDate(o);
      if (dt && dt > latestDt) latestDt = dt;
    });

    const days30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(latestDt);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days30.push({ key, label, count: 0 });
    }

    allOrdersList.forEach(o => {
      const dt = parseOrderDate(o);
      if (dt) {
        const k = dt.toISOString().slice(0, 10);
        const dayItem = days30.find(d => d.key === k);
        if (dayItem) dayItem.count++;
      }
    });

    const maxCount = Math.max(...days30.map(d => d.count), 1);
    const sorted = [...days30].sort((a, b) => b.count - a.count);
    const peakDay = sorted[0];
    const total30Days = days30.reduce((sum, d) => sum + d.count, 0);

    const badge = peakDay && peakDay.count > 0
      ? `Peak: ${peakDay.label} (${peakDay.count} orders) • ${total30Days} in 30d`
      : 'Peak: None';

    const formattedTrend = days30.map(d => ({
      ...d,
      height: d.count > 0 ? Math.max(8, Math.round((d.count / maxCount) * 85)) : 4
    }));

    // Dynamic coordinates for SVG Line & Area chart
    const points = days30.map((d, idx) => {
      const x = Math.round(20 + idx * (960 / 29));
      const normalized = d.count / maxCount;
      const y = Math.round(195 - normalized * 165);
      return { x, y };
    });

    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = Math.round((prev.x + curr.x) / 2);
      linePath += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const areaPath = `${linePath} L 980 220 L 20 220 Z`;

    return {
      trendData: formattedTrend,
      trendBadge: badge,
      trendSvgPath: linePath,
      trendAreaPath: areaPath
    };
  }, [allOrdersList, hasOrders]);

  // 5. Yearly Overview (Monthly Order Volume across the year)
  const { yearlyMonths, yearlyBadge } = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (!hasOrders) {
      return {
        yearlyMonths: months.map(m => ({ month: m, height: 4, orders: '0', rawCount: 0 })),
        yearlyBadge: 'Peak: None'
      };
    }

    const counts = {};
    months.forEach(m => counts[m] = 0);
    allOrdersList.forEach(o => {
      const dt = parseOrderDate(o);
      if (dt) {
        const mIdx = dt.getMonth();
        counts[months[mIdx]]++;
      }
    });

    const max = Math.max(...Object.values(counts), 1);
    const sorted = Object.entries(counts).filter(([_, cnt]) => cnt > 0).sort((a, b) => b[1] - a[1]);
    const topMonths = sorted.slice(0, 3).map(([m]) => m);
    const badge = topMonths.length > 0 ? `Peak: ${topMonths.join(', ')}` : 'Peak: None';

    const items = months.map(m => ({
      month: m,
      height: Math.max(4, Math.round((counts[m] / max) * 95)),
      orders: counts[m].toLocaleString('en-IN'),
      rawCount: counts[m]
    }));

    return { yearlyMonths: items, yearlyBadge: badge };
  }, [allOrdersList, hasOrders]);

  // 6. Most Popular Dishes (Ranked by quantity ordered)
  const { popularDishes, popularDishesBadge } = React.useMemo(() => {
    const defaultPlaceholder = [
      { rank: 1, name: 'Meghana Special Chicken Biryani', count: '0 orders', rawCount: 0 },
      { rank: 2, name: 'Chicken 65 Andhra Style', count: '0 orders', rawCount: 0 },
      { rank: 3, name: 'Paneer Hyderabadi Biryani', count: '0 orders', rawCount: 0 },
      { rank: 4, name: 'Butter Naan & Dal Makhani Combo', count: '0 orders', rawCount: 0 }
    ];

    if (!hasOrders) {
      return { popularDishes: defaultPlaceholder, popularDishesBadge: '0 dishes' };
    }

    const dishCounts = {};
    allOrdersList.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(it => {
          const dName = it.name || it.foodName || it.Food_Name;
          if (dName && dName !== 'Dish' && dName !== '-') {
            dishCounts[dName] = (dishCounts[dName] || 0) + (Number(it.quantity) || 1);
          }
        });
      }
    });

    const sorted = Object.entries(dishCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (sorted.length === 0) {
      return { popularDishes: defaultPlaceholder, popularDishesBadge: '0 dishes' };
    }

    const totalDishOrders = sorted.reduce((sum, [_, cnt]) => sum + cnt, 0);
    const badge = `Top ${sorted.length} dishes (${totalDishOrders.toLocaleString('en-IN')} portions)`;

    const items = sorted.map(([dName, cnt], idx) => ({
      rank: idx + 1,
      name: dName,
      count: `${cnt.toLocaleString('en-IN')} orders`,
      rawCount: cnt
    }));

    return { popularDishes: items, popularDishesBadge: badge };
  }, [allOrdersList, hasOrders]);

  // 7. Time breakdown for #1 Dish (Donut Chart)
  const { dishTimeBreakdown, donutBadge } = React.useMemo(() => {
    if (!hasOrders) {
      return {
        dishTimeBreakdown: { lunch: 0, dinner: 0, lateNight: 0, morning: 0, topName: 'Meghana Special Chicken Biryani', topSlot: { name: 'Lunch', percent: 0 } },
        donutBadge: 'Peak: None'
      };
    }
    const topName = popularDishes[0]?.name || 'Meghana Special Chicken Biryani';
    let lunch = 0, dinner = 0, lateNight = 0, morning = 0, total = 0;

    allOrdersList.forEach(o => {
      const dt = parseOrderDate(o);
      if (dt) {
        const hasDish = Array.isArray(o.items) && o.items.some(i => (i.name || i.foodName || i.Food_Name) === topName);
        if (hasDish) {
          total++;
          const h = dt.getHours();
          if (h >= 12 && h < 16) lunch++;
          else if (h >= 19 && h < 22) dinner++;
          else if (h >= 22 || h < 4) lateNight++;
          else morning++;
        }
      }
    });

    if (total === 0) {
      return {
        dishTimeBreakdown: { lunch: 0, dinner: 0, lateNight: 0, morning: 0, topName, topSlot: { name: 'Lunch', percent: 0 } },
        donutBadge: 'Peak: None'
      };
    }

    const lunchPct = Math.round((lunch / total) * 100);
    const dinnerPct = Math.round((dinner / total) * 100);
    const lateNightPct = Math.round((lateNight / total) * 100);
    const morningPct = Math.max(0, 100 - (lunchPct + dinnerPct + lateNightPct));

    const slots = [
      { name: 'Lunch', percent: lunchPct, count: lunch },
      { name: 'Dinner', percent: dinnerPct, count: dinner },
      { name: 'Late Night', percent: lateNightPct, count: lateNight },
      { name: 'Morning', percent: morningPct, count: morning }
    ].sort((a, b) => b.percent - a.percent);

    const topSlot = slots[0];
    const badge = `Peak: ${topSlot.name} (${topSlot.percent}%)`;

    return {
      dishTimeBreakdown: {
        lunch: lunchPct,
        dinner: dinnerPct,
        lateNight: lateNightPct,
        morning: morningPct,
        topName,
        totalOrders: total,
        topSlot
      },
      donutBadge: badge
    };
  }, [allOrdersList, hasOrders, popularDishes]);

  return (
    <div className="restaurant-dashboard-wrapper">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="rd-toast">
          <Sparkles size={18} color="#fc5200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="rd-header">
        <div className="rd-header-inner">
          <div className="rd-brand">
            <div className="rd-logo-box">
              <Utensils size={22} />
            </div>
            <div>
              <h1 className="rd-brand-title">FoodHub Restaurant</h1>
              <span className="rd-brand-subtitle">Meghana Foods (Flagship)</span>
            </div>
          </div>

          <div className="rd-header-actions">
            {/* Live Firebase Realtime Status */}
            <div className="rd-status-pill" title="Synchronized with Firebase Realtime Database">
              <span className="rd-status-dot"></span>
              <span>Firebase RTDB Live</span>
            </div>

            {/* Switch back to customer app */}
            <button className="rd-btn-outline" onClick={onBackToStore} title="Open customer storefront">
              <ArrowLeft size={15} />
              <span>Customer Store</span>
            </button>

            {/* Dashboard indicator */}
            <span className="rd-pill-active">Dashboard</span>

            {/* Quick Add Food Item */}
            <button className="rd-btn-primary" onClick={scrollToForm}>
              <Plus size={16} />
              <span>Add Food Item</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="rd-container">
        {/* KPI Top Summary Cards */}
        <section className="rd-kpi-grid">
          {/* Card 1: Total Orders */}
          <div className="rd-kpi-card">
            <div className="rd-kpi-label">Total Orders</div>
            <div className="rd-kpi-value">{totalOrdersCount}</div>
            <div className="rd-kpi-subtitle">
              {hasOrders ? `${todayOrdersCount} today (${yesterdayDiff >= 0 ? `+${yesterdayDiff}%` : `${yesterdayDiff}%`} vs yesterday)` : '0 orders'}
            </div>
          </div>

          {/* Card 2: Total Revenue */}
          <div className="rd-kpi-card">
            <div className="rd-kpi-label">Total Revenue</div>
            <div className="rd-kpi-value">{revenueDisplay}</div>
            <div className="rd-kpi-subtitle">
              {hasOrders ? `₹${todayRevenue.toLocaleString('en-IN')} today` : '₹0 today'}
            </div>
          </div>

          {/* Card 3: Active Menu Items */}
          <div className="rd-kpi-card">
            <div className="rd-kpi-label">Active Menu Items</div>
            <div className="rd-kpi-value">{totalMenuItemsCount}</div>
            <div className="rd-kpi-subtitle">
              {hasOrders ? `${totalMenuItemsCount} items published` : '0 items'}
            </div>
          </div>

          {/* Card 4: Average Order Value */}
          <div className="rd-kpi-card">
            <div className="rd-kpi-label">Average Order Value</div>
            <div className="rd-kpi-value">{avgOrderValue}</div>
            <div className="rd-kpi-subtitle">
              {hasOrders ? `Across ${totalOrdersCount} orders` : '0% vs last week'}
            </div>
          </div>
        </section>

        {/* Section: Add Food Item Form */}
        <section className="rd-card" ref={formRef} id="add-food-item-section">
          <form onSubmit={handleAddFoodItem}>
            <div className="rd-card-header">
              <div>
                <h2 className="rd-card-title">Add Food Item</h2>
                <p className="rd-card-subtitle">Create a new menu item and publish it to the live menu board.</p>
              </div>
              <button
                type="submit"
                className="rd-btn-primary"
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'Publishing...' : 'Add Item'}
              </button>
            </div>

            {/* Input Row 1: Name, Category, Price */}
            <div className="rd-form-grid">
              <div className="rd-form-field">
                <label className="rd-form-label">Food Name</label>
                <input
                  type="text"
                  className="rd-input"
                  placeholder="e.g. Chicken Biryani"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="rd-form-field">
                <label className="rd-form-label">Category</label>
                <select
                  className="rd-select"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                >
                  <option value="Biryani Specials">Biryani Specials</option>
                  <option value="South Indian Delights">South Indian Delights</option>
                  <option value="Burgers & Wraps">Burgers & Wraps</option>
                  <option value="Pizzas & Pastas">Pizzas & Pastas</option>
                  <option value="Chinese Wok & Bowls">Chinese Wok & Bowls</option>
                  <option value="Desserts & Shakes">Desserts & Shakes</option>
                </select>
              </div>

              <div className="rd-form-field">
                <label className="rd-form-label">Price</label>
                <div className="rd-price-wrap">
                  <span className="rd-price-prefix">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="rd-input"
                    placeholder="185"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Image Upload Option */}
            <div className="rd-image-section">
              <div className="rd-image-header">
                <span className="rd-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ImageIcon size={15} color="#fc5200" />
                  <strong>Dish Image</strong>
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {/* Veg / Non-Veg toggle */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={isVeg}
                      onChange={(e) => setIsVeg(e.target.checked)}
                      style={{ accentColor: '#0f8a3c', width: '16px', height: '16px' }}
                    />
                    <span style={{ color: isVeg ? '#0f8a3c' : '#64748b' }}>
                      {isVeg ? '🌱 Pure Veg' : '🍗 Non-Veg'}
                    </span>
                  </label>

                  {/* Toggle Upload vs URL */}
                  <div className="rd-image-toggle">
                    <button
                      type="button"
                      className={`rd-image-toggle-btn ${imageType === 'upload' ? 'active' : ''}`}
                      onClick={() => setImageType('upload')}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      className={`rd-image-toggle-btn ${imageType === 'url' ? 'active' : ''}`}
                      onClick={() => setImageType('url')}
                    >
                      Image URL
                    </button>
                  </div>
                </div>
              </div>

              <div className="rd-image-preview-container">
                {imagePreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={imagePreview} alt="Preview" className="rd-image-preview" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setImageUrl(''); }}
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        background: '#ef4444',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: 12,
                    background: '#f1f3f7',
                    border: '1px dashed #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8'
                  }}>
                    <ImageIcon size={28} />
                  </div>
                )}

                {imageType === 'upload' ? (
                  <label className="rd-file-dropzone">
                    <Upload size={18} color="#fc5200" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      Click to choose photo from computer
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>PNG, JPG or WebP (max 2MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                    />
                  </label>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <input
                      type="url"
                      className="rd-input"
                      placeholder="Paste image web address (https://...)"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {[
                        { name: 'Biryani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80' },
                        { name: 'Paneer', url: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=500&q=80' },
                        { name: 'Dosa', url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&q=80' },
                        { name: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80' }
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setImageUrl(preset.url);
                            setImagePreview(preset.url);
                          }}
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            color: '#fc5200',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          + {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description Field */}
            <div className="rd-form-field">
              <label className="rd-form-label">Description</label>
              <textarea
                className="rd-textarea"
                rows="2"
                placeholder="Basmati rice, marinated chicken, herbs, and slow-cooked spices."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </form>
        </section>

        {/* Section: Peak Hours */}
        <section className="rd-card">
          <div className="rd-card-header">
            <div>
              <h2 className="rd-card-title">Peak Ordering Hours</h2>
              <p className="rd-card-subtitle">Hourly order volume across the operating day.</p>
            </div>
            <span className="rd-pill-badge">{peakHourBadge}</span>
          </div>

          <div className="rd-bars-container">
            {peakHours.map((item) => (
              <div key={item.hour} className="rd-bar-column">
                <div className="rd-bar-tooltip">{item.count}</div>
                <div
                  className="rd-bar-pill"
                  style={{ height: `${item.height}%` }}
                />
                <span className="rd-bar-label">{item.hour}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Busiest Days of the Week */}
        <section className="rd-card">
          <div className="rd-card-header">
            <div>
              <h2 className="rd-card-title">Busiest Days of the Week</h2>
              <p className="rd-card-subtitle">Order distribution across days of the week.</p>
            </div>
            <span className="rd-pill-badge">{busiestDayBadge}</span>
          </div>

          <div className="rd-bars-container">
            {busiestDays.map((item) => (
              <div key={item.day} className="rd-bar-column">
                <div className="rd-bar-tooltip">{item.orders}</div>
                <div
                  className="rd-bar-pill"
                  style={{ height: `${item.height}%` }}
                />
                <span className="rd-bar-label">{item.day}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Monthly Order Trends */}
        <section className="rd-card">
          <div className="rd-card-header">
            <div>
              <h2 className="rd-card-title">Monthly Order Trends</h2>
              <p className="rd-card-subtitle">Daily order volume and trend line across the past 30 days.</p>
            </div>
            <span className="rd-pill-badge">{trendBadge}</span>
          </div>

          <div className="rd-trend-chart-box">
            {/* Interactive vertical bars with tooltips in background */}
            <div className="rd-trend-faint-columns">
              {trendData.map((item, idx) => (
                <div key={idx} className="rd-faint-col" style={{ height: `${item.height}%` }}>
                  <div className="rd-bar-tooltip">{item.label}: {item.count} orders</div>
                </div>
              ))}
            </div>

            {/* Glowing SVG Area Curve & Stroke */}
            <svg
              className="rd-trend-svg"
              viewBox="0 0 1000 220"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fc5200" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#fc5200" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path
                d={trendAreaPath}
                fill="url(#trendGradient)"
              />

              {/* Glowing Line */}
              <path
                d={trendSvgPath}
                fill="none"
                stroke="#fc5200"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </section>

        {/* Section: Yearly Overview */}
        <section className="rd-card">
          <div className="rd-card-header">
            <div>
              <h2 className="rd-card-title">Yearly Overview</h2>
              <p className="rd-card-subtitle">Monthly order volume across the year.</p>
            </div>
            <span className="rd-pill-badge">{yearlyBadge}</span>
          </div>

          <div className="rd-bars-container">
            {yearlyMonths.map((item) => (
              <div key={item.month} className="rd-bar-column">
                <div className="rd-bar-tooltip">{item.orders} orders</div>
                <div
                  className="rd-bar-pill"
                  style={{ height: `${item.height}%` }}
                />
                <span className="rd-bar-label">{item.month}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Most Popular Dishes */}
        <section className="rd-card">
          <div className="rd-card-header">
            <div>
              <h2 className="rd-card-title">Most Popular Dishes</h2>
              <p className="rd-card-subtitle">Ranked by total portions ordered.</p>
            </div>
            <span className="rd-pill-badge">{popularDishesBadge}</span>
          </div>

          <div className="rd-dishes-list">
            {popularDishes.map((dish) => (
              <div key={dish.rank} className="rd-dish-row">
                <div className={`rd-dish-rank ${dish.rank === 1 && hasOrders ? 'top-1' : 'regular'}`}>
                  {dish.rank}
                </div>
                <div className="rd-dish-icon-box">
                  <Utensils size={16} />
                </div>
                <div className="rd-dish-info">
                  <div className="rd-dish-name">{dish.name}</div>
                  <div className="rd-dish-orders">{dish.count}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: When Is Our #1 Dish Sold? (Donut Chart) */}
        <section className="rd-card">
          <div className="rd-card-header">
            <div>
              <h2 className="rd-card-title">When Is Our #1 Dish Sold?</h2>
              <p className="rd-card-subtitle">
                {hasOrders
                  ? `Time-slot breakdown for ${dishTimeBreakdown.topName} (${dishTimeBreakdown.totalOrders || 0} portions ordered).`
                  : 'Time-slot breakdown for #1 Dish.'}
              </p>
            </div>
            <span className="rd-pill-badge">{donutBadge}</span>
          </div>

          <div className="rd-donut-layout">
            {/* Circular SVG Donut */}
            <div className="rd-donut-wrapper">
              <svg width="170" height="170" viewBox="0 0 170 170">
                {/* Background Ring */}
                <circle
                  cx="85"
                  cy="85"
                  r="62"
                  fill="none"
                  stroke="#f8fafc"
                  strokeWidth="24"
                />

                {/* Arc 1: Lunch */}
                <circle
                  cx="85"
                  cy="85"
                  r="62"
                  fill="none"
                  stroke="#fc5200"
                  strokeWidth="24"
                  strokeDasharray={`${(dishTimeBreakdown.lunch / 100) * 389.56} 389.56`}
                  strokeDashoffset="0"
                  transform="rotate(-90 85 85)"
                />

                {/* Arc 2: Dinner */}
                <circle
                  cx="85"
                  cy="85"
                  r="62"
                  fill="none"
                  stroke="#ff7a3d"
                  strokeWidth="24"
                  strokeDasharray={`${(dishTimeBreakdown.dinner / 100) * 389.56} 389.56`}
                  strokeDashoffset={`-${(dishTimeBreakdown.lunch / 100) * 389.56}`}
                  transform="rotate(-90 85 85)"
                />

                {/* Arc 3: Late Night */}
                <circle
                  cx="85"
                  cy="85"
                  r="62"
                  fill="none"
                  stroke="#ffb285"
                  strokeWidth="24"
                  strokeDasharray={`${(dishTimeBreakdown.lateNight / 100) * 389.56} 389.56`}
                  strokeDashoffset={`-${((dishTimeBreakdown.lunch + dishTimeBreakdown.dinner) / 100) * 389.56}`}
                  transform="rotate(-90 85 85)"
                />

                {/* Arc 4: Morning */}
                <circle
                  cx="85"
                  cy="85"
                  r="62"
                  fill="none"
                  stroke="#ffe4d6"
                  strokeWidth="24"
                  strokeDasharray={`${(dishTimeBreakdown.morning / 100) * 389.56} 389.56`}
                  strokeDashoffset={`-${((dishTimeBreakdown.lunch + dishTimeBreakdown.dinner + dishTimeBreakdown.lateNight) / 100) * 389.56}`}
                  transform="rotate(-90 85 85)"
                />
              </svg>

              {/* Center Text */}
              <div className="rd-donut-center">
                <span className="rd-donut-percent">{dishTimeBreakdown.topSlot?.percent || 0}%</span>
                <span className="rd-donut-center-label">{dishTimeBreakdown.topSlot?.name || 'Lunch'}</span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="rd-donut-legend">
              <div className="rd-legend-item">
                <span className="rd-legend-dot" style={{ background: '#fc5200' }}></span>
                <span>Lunch (12 PM - 4 PM) — <strong>{dishTimeBreakdown.lunch}%</strong></span>
              </div>
              <div className="rd-legend-item">
                <span className="rd-legend-dot" style={{ background: '#ff7a3d' }}></span>
                <span>Dinner (7 PM - 10 PM) — <strong>{dishTimeBreakdown.dinner}%</strong></span>
              </div>
              <div className="rd-legend-item">
                <span className="rd-legend-dot" style={{ background: '#ffb285' }}></span>
                <span>Late Night (10 PM - 2 AM) — <strong>{dishTimeBreakdown.lateNight}%</strong></span>
              </div>
              <div className="rd-legend-item">
                <span className="rd-legend-dot" style={{ background: '#ffe4d6' }}></span>
                <span>Morning (8 AM - 12 PM) — <strong>{dishTimeBreakdown.morning}%</strong></span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
