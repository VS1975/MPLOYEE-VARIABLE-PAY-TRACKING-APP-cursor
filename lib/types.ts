export type PayConfig = {
  id: number;
  normal_pay_per_rack: number;
  bonus_threshold_racks: number;
  bonus_pay_per_rack: number;
  updated_at: string;
};

export type SubmissionRow = {
  id: string;
  employee_id: string;
  employee_name: string;
  work_date: string;
  rack_count: number;
  work_type: string | null;
  before_image_path: string;
  after_image_path: string;
  before_captured_at: string;
  after_captured_at: string;
  submitted_at: string;
};

export type SubmissionWithPay = SubmissionRow & {
  pay_amount: number;
  pay_rate_label: string;
};
