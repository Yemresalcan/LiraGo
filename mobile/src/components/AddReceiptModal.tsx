import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface SourceOption {
    icon: string;
    label: string;
    onPress: () => void;
    color?: string;
}

interface AddReceiptModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    options: SourceOption[];
    cancelText?: string;
}

const AddReceiptModal: React.FC<AddReceiptModalProps> = ({
    visible,
    onClose,
    title,
    message,
    options,
    cancelText = 'İptal',
}) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(50)).current;
    const { theme, colors } = useTheme();

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 50,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View
                    style={[
                        styles.overlay,
                        {
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.modalContainer,
                                {
                                    backgroundColor: colors.card,
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                },
                            ]}
                        >
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
                                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                                <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
                            </View>

                            {/* Options */}
                            <View style={styles.optionsContainer}>
                                {options.map((option, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.optionButton,
                                            { backgroundColor: colors.background },
                                            index === 0 && { backgroundColor: theme === 'dark' ? '#333' : '#E6E6FA' },
                                        ]}
                                        onPress={() => {
                                            option.onPress();
                                            onClose();
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View
                                            style={[
                                                styles.iconContainer,
                                                { backgroundColor: option.color || '#8CE4FF' },
                                            ]}
                                        >
                                            <Icon name={option.icon} size={28} color="#fff" />
                                        </View>
                                        <Text style={[styles.optionText, { color: colors.text }]}>{option.label}</Text>
                                        <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Cancel Button */}
                            <TouchableOpacity
                                style={[styles.cancelButton, { backgroundColor: colors.background }]}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{cancelText}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    headerLine: {
        width: 40,
        height: 4,
        borderRadius: 2,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    optionsContainer: {
        marginBottom: 16,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 16,
        marginBottom: 12,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    optionText: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
    },
    cancelButton: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    cancelText: {
        fontSize: 17,
        fontWeight: '600',
    },
});

export default AddReceiptModal;
