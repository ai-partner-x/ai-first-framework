import { useState } from 'react';
import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { UserApi } from '@user-crud/api/client';
import type { User, CreateUserDto } from '@user-crud/api/client';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@aff/admin-component';

const userApi = new UserApi(import.meta.env.VITE_API_URL || 'http://localhost:3001');

// 表单校验 Schema
const userSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符'),
  email: z.string().email('请输入有效的邮箱'),
  age: z.coerce.number().min(1).max(150).optional(),
});

interface UserFormData {
  username: string;
  email: string;
  age?: number;
}

export default function App() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const { data: users = [], isLoading, mutate } = useSWR('users', () => userApi.list());

  // ==================== 表单 ====================
  const form = useForm<UserFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(userSchema) as any,
    defaultValues: { username: '', email: '', age: undefined },
  });

  const onSubmit = async (data: UserFormData) => {
    setIsMutating(true);
    try {
      if (editingUser) {
        await userApi.update(String(editingUser.id), data);
        toast.success('更新成功');
      } else {
        await userApi.create(data as CreateUserDto);
        toast.success('创建成功');
      }
      mutate();
      closeDialog();
    } catch (err) {
      toast.error((err as Error).message || '操作失败');
    } finally {
      setIsMutating(false);
    }
  };

  // ==================== Dialog 控制 ====================
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    form.reset();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({ username: user.username, email: user.email, age: user.age });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    try {
      await userApi.delete(String(id));
      toast.success('删除成功');
      mutate();
    } catch (err) {
      toast.error((err as Error).message || '删除失败');
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) closeDialog();
    else setDialogOpen(true);
  };

  // ==================== 渲染 ====================
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>用户管理 (Admin - Vite)</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button>新增用户</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? '编辑用户' : '新增用户'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>用户名</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>邮箱</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>年龄</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isMutating}>
                    {isMutating ? '提交中...' : editingUser ? '更新' : '创建'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4">加载中...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>用户名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>年龄</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.age || '-'}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                        编辑
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
