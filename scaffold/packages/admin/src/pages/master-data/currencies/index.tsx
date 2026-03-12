import { useState } from "react";
import { Coins } from "lucide-react";
import { MasterDetail, type MasterDetailItem, type EditMode } from "@/components/admin-ui/master-detail";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Currency extends MasterDetailItem {
  currencyCode: string;
  currencyName: string;
  symbol: string;
  decimalPlaces: number;
  exchangeRate: number;
  country: string;
  isoCode: string;
  minorUnit: string;
  createdAt: string;
  updatedAt: string;
}

const initialCurrencies: Currency[] = [
  { id: "1", title: "CNY - 人民币", subtitle: "中国", currencyCode: "CNY", currencyName: "人民币", symbol: "¥", decimalPlaces: 2, exchangeRate: 1, country: "中国", isoCode: "156", minorUnit: "分", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "2", title: "USD - 美元", subtitle: "美国", currencyCode: "USD", currencyName: "美元", symbol: "$", decimalPlaces: 2, exchangeRate: 7.24, country: "美国", isoCode: "840", minorUnit: "美分", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "3", title: "EUR - 欧元", subtitle: "欧盟", currencyCode: "EUR", currencyName: "欧元", symbol: "€", decimalPlaces: 2, exchangeRate: 7.89, country: "欧盟", isoCode: "978", minorUnit: "欧分", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "4", title: "JPY - 日元", subtitle: "日本", currencyCode: "JPY", currencyName: "日元", symbol: "¥", decimalPlaces: 0, exchangeRate: 0.048, country: "日本", isoCode: "392", minorUnit: "-", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "5", title: "GBP - 英镑", subtitle: "英国", currencyCode: "GBP", currencyName: "英镑", symbol: "£", decimalPlaces: 2, exchangeRate: 9.15, country: "英国", isoCode: "826", minorUnit: "便士", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "6", title: "HKD - 港币", subtitle: "中国香港", currencyCode: "HKD", currencyName: "港币", symbol: "HK$", decimalPlaces: 2, exchangeRate: 0.93, country: "中国香港", isoCode: "344", minorUnit: "仙", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
];

export function CurrenciesPage() {
  const [currencies, setCurrencies] = useState(initialCurrencies);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>(currencies[0]?.id);
  const [formData, setFormData] = useState({
    currencyCode: "",
    currencyName: "",
    symbol: "",
    decimalPlaces: 2,
    exchangeRate: 1,
    country: "",
    isoCode: "",
    minorUnit: "",
    status: "active",
  });

  const filtered = currencies.filter((c) => {
    if (!searchKeyword) return true;
    const k = searchKeyword.toLowerCase();
    return c.currencyCode.toLowerCase().includes(k) || c.currencyName.toLowerCase().includes(k) || c.country.toLowerCase().includes(k);
  });

  const initForm = (item: Currency | null) => {
    if (item) {
      setFormData({
        currencyCode: item.currencyCode,
        currencyName: item.currencyName,
        symbol: item.symbol,
        decimalPlaces: item.decimalPlaces,
        exchangeRate: item.exchangeRate,
        country: item.country,
        isoCode: item.isoCode,
        minorUnit: item.minorUnit,
        status: item.status?.color === "green" ? "active" : "inactive",
      });
    } else {
      setFormData({
        currencyCode: "",
        currencyName: "",
        symbol: "",
        decimalPlaces: 2,
        exchangeRate: 1,
        country: "",
        isoCode: "",
        minorUnit: "",
        status: "active",
      });
    }
  };

  const handleSave = (item: Currency | null, mode: EditMode) => {
    const now = new Date().toISOString().split("T")[0];
    if (mode === "create") {
      const newItem: Currency = {
        id: Date.now().toString(),
        title: `${formData.currencyCode} - ${formData.currencyName}`,
        subtitle: formData.country,
        currencyCode: formData.currencyCode,
        currencyName: formData.currencyName,
        symbol: formData.symbol,
        decimalPlaces: formData.decimalPlaces,
        exchangeRate: formData.exchangeRate,
        country: formData.country,
        isoCode: formData.isoCode,
        minorUnit: formData.minorUnit,
        status: { label: formData.status === "active" ? "启用" : "停用", color: formData.status === "active" ? "green" : "gray" },
        createdAt: now,
        updatedAt: now,
      };
      setCurrencies((prev) => [...prev, newItem]);
      setSelectedId(newItem.id);
    } else if (item) {
      setCurrencies((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? {
                ...c,
                title: `${formData.currencyCode} - ${formData.currencyName}`,
                subtitle: formData.country,
                currencyCode: formData.currencyCode,
                currencyName: formData.currencyName,
                symbol: formData.symbol,
                decimalPlaces: formData.decimalPlaces,
                exchangeRate: formData.exchangeRate,
                country: formData.country,
                isoCode: formData.isoCode,
                minorUnit: formData.minorUnit,
                status: { label: formData.status === "active" ? "启用" : "停用", color: formData.status === "active" ? "green" : "gray" },
                updatedAt: now,
              }
            : c
        )
      );
    }
  };

  const handleDelete = (item: Currency) => {
    setCurrencies((prev) => prev.filter((c) => c.id !== item.id));
    if (selectedId === item.id) setSelectedId(currencies.find((c) => c.id !== item.id)?.id);
  };

  const renderForm = (item: Currency | null, mode: EditMode) => {
    if (mode === "edit" && item && formData.currencyCode !== item.currencyCode) initForm(item);
    else if (mode === "create" && formData.currencyCode !== "") initForm(null);

    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-lg font-bold text-white">
              {formData.currencyCode || "?"}
            </div>
            <div>
              <h2 className="text-lg font-bold">{formData.currencyName || "新币种"}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{formData.country || "-"}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3">
            <h3 className="font-semibold">基本信息</h3>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-4 p-5">
            <div className="space-y-1.5">
              <Label className="text-xs">币种代码 *</Label>
              <Input value={formData.currencyCode} onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value.toUpperCase() })} placeholder="如: CNY" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">币种名称 *</Label>
              <Input value={formData.currencyName} onChange={(e) => setFormData({ ...formData, currencyName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">符号</Label>
              <Input value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">小数位</Label>
              <Input type="number" value={formData.decimalPlaces} onChange={(e) => setFormData({ ...formData, decimalPlaces: parseInt(e.target.value, 10) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">汇率</Label>
              <Input type="number" step="0.01" value={formData.exchangeRate} onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">国家/地区</Label>
              <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ISO 代码</Label>
              <Input value={formData.isoCode} onChange={(e) => setFormData({ ...formData, isoCode: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">辅币单位</Label>
              <Input value={formData.minorUnit} onChange={(e) => setFormData({ ...formData, minorUnit: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">状态</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDetail = (c: Currency) => (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-lg font-bold text-white">
            {c.symbol}
          </div>
          <div>
            <h2 className="text-lg font-bold">{c.currencyName}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{c.currencyCode} · {c.country}</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b bg-muted/30 px-5 py-3">
          <h3 className="font-semibold">基本信息</h3>
        </div>
        <div className="grid grid-cols-3 gap-x-6 gap-y-4 p-5">
          <div><p className="text-xs text-muted-foreground">汇率</p><p className="text-sm font-medium">{c.exchangeRate}</p></div>
          <div><p className="text-xs text-muted-foreground">小数位</p><p className="text-sm">{c.decimalPlaces}</p></div>
          <div><p className="text-xs text-muted-foreground">辅币单位</p><p className="text-sm">{c.minorUnit}</p></div>
          <div><p className="text-xs text-muted-foreground">ISO 代码</p><p className="text-sm">{c.isoCode}</p></div>
          <div><p className="text-xs text-muted-foreground">最后更新</p><p className="text-sm">{c.updatedAt}</p></div>
        </div>
      </div>
    </div>
  );

  return (
    <MasterDetail<Currency>
      title="币种主数据"
      subtitle="管理和维护货币及汇率"
      headerIcon={<Coins className="h-5 w-5" />}
      items={filtered}
      selectedId={selectedId}
      onSelect={(item) => setSelectedId(item.id)}
      onSearch={setSearchKeyword}
      searchPlaceholder="搜索币种代码、名称或国家..."
      createLabel="新建币种"
      renderDetail={renderDetail}
      renderForm={renderForm}
      onSave={handleSave}
      onDelete={handleDelete}
      masterWidth={320}
    />
  );
}

export default CurrenciesPage;
