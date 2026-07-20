import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CAMPAIGN_CATEGORIES } from "@/types/campaign";
import { cn } from "@/lib/utils";

export function Step1BasicInfo() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Campaign title</FormLabel>
            <FormControl>
              <Input placeholder="Give your campaign a clear, compelling name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Short description</FormLabel>
            <FormControl>
              <Textarea placeholder="Summarise your campaign in a sentence or two" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Campaign category">
                {CAMPAIGN_CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant="outline"
                    size="sm"
                    role="radio"
                    aria-checked={field.value === cat}
                    className={cn(
                      "rounded-full border-border/60 transition-colors",
                      field.value === cat && "bg-primary/10 text-primary border-primary"
                    )}
                    onClick={() => {
                      if (field.value === cat) {
                        field.onChange("");
                      } else {
                        field.onChange(cat);
                      }
                    }}
                    tabIndex={0}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="targetAudience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Target audience</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Local community, Students, Animal lovers" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export function Step2Details() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="longDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Long description</FormLabel>
            <FormControl>
              <Textarea placeholder="Tell your story in detail" className="min-h-[150px]" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="story"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Story</FormLabel>
            <FormControl>
              <Textarea placeholder="Share the inspiration behind your campaign" className="min-h-[150px]" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="coverImageUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cover image URL</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com/image.jpg" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="mediaUrls"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Media URLs (comma separated)</FormLabel>
            <FormControl>
              <Input
                placeholder="https://example.com/img1.jpg, https://example.com/video.mp4"
                value={field.value?.join(", ") || ""}
                onChange={(e) => {
                  const arr = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                  field.onChange(arr);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export function Step3GoalDeadline() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="goalAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Goal amount</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="1"
                placeholder="10000"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="currency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Currency</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="deadline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Deadline</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="donorWallEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Donor wall</FormLabel>
              <p className="text-sm text-muted-foreground">
                Show a public list of people who supported your campaign.
              </p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}

export function Step4BankDetails() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="accountHolderName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account holder name</FormLabel>
            <FormControl>
              <Input placeholder="John Doe" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="bankName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bank name</FormLabel>
            <FormControl>
              <Input placeholder="Bank of America" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="accountNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account number</FormLabel>
            <FormControl>
              <Input placeholder="000123456789" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="routingNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Routing number</FormLabel>
            <FormControl>
              <Input placeholder="021000021" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="swiftBic"
        render={({ field }) => (
          <FormItem>
            <FormLabel>SWIFT / BIC</FormLabel>
            <FormControl>
              <Input placeholder="BOFAUS3N" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="country"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Country</FormLabel>
            <FormControl>
              <Input placeholder="United States" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}