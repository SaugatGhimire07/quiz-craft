import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import PropTypes from "prop-types";

// Create the context
const SocketContext = createContext(null);

// Custom hook to use the socket context
export const useSocket = () => useContext(SocketContext);

// Provider component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    console.log("Initializing socket connection");

    const socketInstance = io("http://localhost:5001", {
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      transports: ["websocket", "polling"], // Explicitly try both transport methods
    });

    setSocket(socketInstance);

    // Connection event handlers
    const onConnect = () => {
      console.log("Connected to quiz server, socket ID:", socketInstance.id);
      setIsConnected(true);
    };

    const onDisconnect = (reason) => {
      console.log("Disconnected from server:", reason);
      setIsConnected(false);
    };

    const onError = (error) => {
      console.error("Socket error:", error);
    };

    const onConnectError = (error) => {
      console.error("Connection error:", error);
    };

    // Add event listeners
    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);
    socketInstance.on("error", onError);
    socketInstance.on("connect_error", onConnectError);

    // Log when the connection is made
    socketInstance.on("connect", () => {
      console.log("Socket connected with ID:", socketInstance.id);
    });

    // Add better reconnection handling
    socketInstance.on("reconnect", (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
    });

    // Clean up
    return () => {
      console.log("Cleaning up socket connection");
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
      socketInstance.off("error", onError);
      socketInstance.off("connect_error", onConnectError);
      socketInstance.disconnect();
    };
  }, []);

  // Function to emit socket events with error handling
  const emitEvent = useCallback(
    (eventName, data, callback) => {
      if (!socket || !isConnected) {
        console.error(`Cannot emit ${eventName} - socket not connected`);
        return false;
      }

      console.log(`Emitting ${eventName}:`, data);

      try {
        socket.emit(eventName, data, callback);
        return true;
      } catch (error) {
        console.error(`Error emitting ${eventName}:`, error);
        return false;
      }
    },
    [socket, isConnected]
  );

  const contextValue = {
    socket,
    isConnected,
    emitEvent,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Export default provider component
export default SocketProvider;
