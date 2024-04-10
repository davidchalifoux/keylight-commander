import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import React from "react";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { z } from "zod";
import { useServiceStore } from "../lib/hooks/useServiceStore";
import { nanoid } from "nanoid";

const schema = z.object({
  name: z.string(),
  ipAddress: z.string().ip(),
});

type Props = {
  onClose: () => void;
  isOpen: boolean;
};

export const ManualAddModal: React.FC<Props> = (props) => {
  const serviceStore = useServiceStore();

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const form = useForm({
    initialValues: {
      name: "",
      ipAddress: "",
    },

    validate: zodResolver(schema),
  });

  return (
    <Modal
      opened={props.isOpen}
      onClose={props.onClose}
      title="Manually add light"
    >
      <form
        onSubmit={form.onSubmit((values) => {
          const { error } = serviceStore.addService({
            id: nanoid(),
            name: values.name,
            ip_v4: values.ipAddress,
            port: 9123,
          });

          if (error) {
            setErrorMessage(error);
            return;
          }

          form.reset();
          props.onClose();
        })}
      >
        <Stack>
          <Text size="sm" c="red">
            {errorMessage}
          </Text>

          <TextInput
            withAsterisk
            label="Name"
            {...form.getInputProps("name")}
          />

          <TextInput
            withAsterisk
            label="IP Address"
            {...form.getInputProps("ipAddress")}
          />

          <Group justify="flex-end">
            <Button
              variant="subtle"
              color={"gray"}
              onClick={() => {
                form.reset();
                props.onClose();
              }}
            >
              Cancel
            </Button>

            <Button type="submit">Submit</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
