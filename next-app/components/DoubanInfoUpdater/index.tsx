import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDoubanInfo } from "./action";

export function DoubanInfoUpdater({ movieId }: { movieId: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="text-xs font-black px-2 py-1 rounded-sm h-fit" variant="outline">
          更新豆瓣信息
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>更新豆瓣信息</DialogTitle>
          <DialogDescription>将豆瓣电影的 JSON data 信息粘贴到输入框中，点击保存按钮更新豆瓣信息。</DialogDescription>
        </DialogHeader>
        <form action={updateDoubanInfo}>
          <input hidden aria-hidden type="hidden" name="movieId" value={movieId} />
          <Label htmlFor="json-info">JSON info</Label>
          <Input autoFocus id="json-info" name="json-info" placeholder="Paste JSON info here..." />
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button type="submit">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
