import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { FileUpload } from "./FileUpload";

const meta = {
  title: "Molecules/FileUpload",
  component: FileUpload,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    accept: {
      control: "text",
      description: "File types to accept",
    },
    disabled: {
      control: "boolean",
      description: "Disable the upload button",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
  args: {
    onFileLoad: fn(),
    onError: fn(),
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const CustomAccept: Story = {
  args: {
    accept: ".json",
  },
};

export const WithCustomClass: Story = {
  args: {
    className: "w-full max-w-md",
  },
};

export const Interactive: Story = {
  args: {
    onFileLoad: (krd) => {
      console.log("File loaded:", krd);
      alert(`Workout loaded: ${krd.extensions?.workout?.name || "Unnamed"}`);
    },
    onError: (error, validationErrors) => {
      console.error("Error:", error);
      if (validationErrors) {
        console.error("Validation errors:", validationErrors);
      }
      alert(`Error: ${error}`);
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Try uploading a valid KRD file or an invalid file to see the error handling in action.",
      },
    },
  },
};
