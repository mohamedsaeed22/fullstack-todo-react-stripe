import Button from "./ui/Button";
import useCustomQuery from "../hooks/useAuthenticatedQuery";
import Modal from "./ui/Modal";
import Input from "./ui/Input";
import { ChangeEvent, FormEvent, useState } from "react";
import Textarea from "./ui/Textarea";
import { ITodo } from "../interfaces";
import axiosInstance from "../config/axios.config";
import TodoSkeleton from "./TodoSkeleton";
import { da, faker } from "@faker-js/faker";
const TodoList = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [queryVersion, setQueryVersion] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [todoToEdit, setTodoToEdit] = useState<ITodo>({
    id: 0,
    title: "",
    description: "",
    documentId: "",
  });
  const [todoToAdd, setTodoToAdd] = useState({
    title: "",
    description: "",
  });
  const [isOpenConfirmModal, setIsOpenConfirmModal] = useState(false);
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const storageKey = "loggedInUser";
  const userDataString = localStorage.getItem(storageKey);
  const userData = userDataString ? JSON.parse(userDataString) : null;
  console.log(userData);
  const { isLoading, data } = useCustomQuery({
    queryKey: ["todoList", `${queryVersion}`],
    url: "users/me?populate=todos",
    config: {
      headers: {
        Authorization: `Bearer ${userData.jwt}`,
      },
    },
  });
  console.log(data);
  const onCloseEditModal = () => {
    setTodoToEdit({
      id: 0,
      title: "",
      description: "",
    });
    setIsEditModalOpen(false);
  };
  const onOpenEditModal = (todo: ITodo) => {
    setTodoToEdit(todo);
    setIsEditModalOpen(true);
  };
  const onCloseAddModal = () => {
    setTodoToAdd({
      title: "",
      description: "",
    });
    setIsOpenAddModal(false);
  };
  const onOpenAddModal = () => {
    setIsOpenAddModal(true);
  };
  const closeConfirmModal = () => {
    setTodoToEdit({
      id: 0,
      title: "",
      description: "",
      documentId: "",
    });
    setIsOpenConfirmModal(false);
  };
  const openConfirmModal = (todo: ITodo) => {
    setTodoToEdit(todo);
    setIsOpenConfirmModal(true);
  };
  const onChangeHandler = (
    evt: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { value, name } = evt.target;
    setTodoToEdit({ ...todoToEdit, [name]: value });
  };
  const onGenerateTodos = async () => {
    //100 record
    for (let i = 0; i < 10; i++) {
      try {
        const { data } = await axiosInstance.post(
          `/todos`,
          {
            data: {
              title: faker.word.words(5),
              description: faker.lorem.paragraph(2),
              user: [userData.user.id],
            },
          },
          {
            headers: {
              Authorization: `Bearer ${userData.jwt}`,
            },
          }
        );
        console.log(data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const onChangeAddTodoHandler = (
    evt: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { value, name } = evt.target;
    setTodoToAdd({ ...todoToAdd, [name]: value });
  };
  const onRemove = async () => {
    try {
      const { status } = await axiosInstance.delete(
        `/todos/${todoToEdit.documentId}`,
        {
          headers: {
            Authorization: `Bearer ${userData.jwt}`,
          },
        }
      );
      if (status === 204) {
        closeConfirmModal();
        setQueryVersion((prev) => prev + 1);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const onSubmitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    const { title, description } = todoToEdit;
    try {
      const { status } = await axiosInstance.put(
        `/todos/${todoToEdit.documentId}`,
        {
          data: { title, description },
        },
        {
          headers: {
            Authorization: `Bearer ${userData.jwt}`,
          },
        }
      );
      if (status === 200) {
        onCloseEditModal();
        setQueryVersion((prev) => prev + 1);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsUpdating(false);
    }
  };
  const onSubmitAddTodoHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    const { title, description } = todoToAdd;
    try {
      const { status } = await axiosInstance.post(
        `/todos`,
        {
          data: { title, description, user: [userData.user.id]},
        },
        {
          headers: {
            Authorization: `Bearer ${userData.jwt}`,
          },
        }
      );
      if (status === 201) {
        console.log("from onSubmitAddTodoHandler");
        onCloseAddModal();
        setQueryVersion((prev) => prev + 1);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsUpdating(false);
    }
  };
  if (isLoading)
    return (
      <div className="space-y-1 p-3">
        {Array.from({ length: 3 }, (_, idx) => (
          <TodoSkeleton key={idx} />
        ))}{" "}
      </div>
    );
  return (
    <div className="space-y-1 ">
      <div className="flex w-fit mx-auto my-10 gap-x-2">
        <Button variant="default" onClick={onOpenAddModal} size={"sm"}>
          Post new todo
        </Button>
        <Button variant="outline" onClick={onGenerateTodos} size={"sm"}>
          Generate todos
        </Button>
      </div>
      {data?.todos?.length ? (
        data.todos.map((todo: ITodo) => {
          return (
            <div
              key={todo.id}
              className="flex items-center justify-between hover:bg-gray-100 duration-300 p-3 rounded-md even:bg-gray-100"
            >
              <p className="w-full font-semibold">
                {todo.id} - {todo.title}
              </p>
              <div className="flex items-center justify-end w-full space-x-3">
                <Button
                  variant={"default"}
                  size={"sm"}
                  onClick={() => onOpenEditModal(todo)}
                >
                  Edit
                </Button>
                <Button
                  variant={"danger"}
                  size={"sm"}
                  onClick={() => openConfirmModal(todo)}
                >
                  Remove
                </Button>
              </div>
            </div>
          );
        })
      ) : (
        <h3>No Todos Yet</h3>
      )}
      {/* Add todo Modal */}
      <Modal
        isOpen={isOpenAddModal}
        closeModal={onCloseAddModal}
        title="Add a new todo"
      >
        <form className="space-y-3" onSubmit={onSubmitAddTodoHandler}>
          <Input
            name="title"
            value={todoToAdd.title}
            onChange={onChangeAddTodoHandler}
          />
          <Textarea
            name="description"
            value={todoToAdd.description}
            onChange={onChangeAddTodoHandler}
          />
          <div className="flex items-center space-x-3 mt-4">
            <Button
              className="bg-indigo-700 hover:bg-indigo-800"
              isLoading={isUpdating}
            >
              Done
            </Button>
            <Button type="button" variant={"cancel"} onClick={onCloseAddModal}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
      {/* Edit todo Modal */}
      <Modal
        isOpen={isEditModalOpen}
        closeModal={onCloseEditModal}
        title="Edit this todo"
      >
        <form className="space-y-3" onSubmit={onSubmitHandler}>
          <Input
            name="title"
            value={todoToEdit.title}
            onChange={onChangeHandler}
          />
          <Textarea
            name="description"
            value={todoToEdit.description}
            onChange={onChangeHandler}
          />
          <div className="flex items-center space-x-3 mt-4">
            <Button
              className="bg-indigo-700 hover:bg-indigo-800"
              isLoading={isUpdating}
            >
              Update
            </Button>
            <Button variant={"cancel"} type="button" onClick={onCloseEditModal}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
      {/* Delete todo Modal */}
      <Modal
        isOpen={isOpenConfirmModal}
        closeModal={closeConfirmModal}
        title="Are you sure you want to remove this todo from your store ?"
        description="Deleting this todo will remove it permenantly from your inventory. Any associated data, sales history, and other related information will also be deleted. Please make sure this is the intended action."
      >
        <div className="flex items-center space-x-3 mt-4">
          <Button variant="danger" onClick={onRemove}>
            Yes , Remove
          </Button>
          <Button variant="cancel" type="button" onClick={closeConfirmModal}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TodoList;
